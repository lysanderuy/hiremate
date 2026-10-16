import ast
import json
import os
import re
import urllib.request
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

from .config import path
from .features import tf
from .skills_rules import DEFAULT_DECISIONS, GENERIC, OWN_SKILLS, RENAME
from .util import report

NUMBER = r"(?:one|two|three|four|five|six|seven|eight|nine|ten|\d{1,2})"
YEARS_WITH_NUMBER = re.compile(rf"\b{NUMBER}\b\s*(?:\+|plus)?\s*(?:(?:-|to|or)\s*{NUMBER}\s*)?years?\b", re.IGNORECASE)
YEARS_ANY = re.compile(r"\byears?\b[^.]{0,30}\bexperience\b|\bexperience\b[^.]{0,30}\byears?\b", re.IGNORECASE)

SECTION_START = re.compile(
    r"(?:^|\n|\s)(?:technical skills|computer skills|core qualifications|skills|highlights|qualifications)\s*:?\s*(?:\n|\s)",
    re.IGNORECASE,
)
SECTION_END = re.compile(
    r"\n\s*(?:professional experience|work experience|experience|work history|education|summary|professional summary|accomplishments|certifications|affiliations)\s*:?\s*\n",
    re.IGNORECASE,
)


def parse_skill_list(value) -> list[str]:
    try:
        parsed = ast.literal_eval(value)
    except (ValueError, SyntaxError):
        return []
    return [skill for skill in parsed if isinstance(skill, str)] if isinstance(parsed, list) else []


def from_data_jobs(cfg: dict) -> Counter:
    from datasets import load_dataset

    rows = load_dataset(cfg["skills"]["dataset"], split="train", streaming=True).take(cfg["skills"]["sample_rows"])
    return Counter(skill.lower() for row in rows for skill in set(parse_skill_list(row["job_skills"])))


def read_table(file: Path) -> pd.DataFrame:
    if file.suffix.lower() in (".xlsx", ".xls"):
        return pd.read_excel(file)
    return pd.read_csv(file, sep=None, engine="python", encoding_errors="replace")


def from_onet(cfg: dict, sources_dir: Path) -> tuple[list[str], set[str]]:
    table = None
    for url in cfg["skills"]["onet_urls"]:
        try:
            request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            target = sources_dir / url.rsplit("/", 1)[-1]
            target.write_bytes(urllib.request.urlopen(request, timeout=60).read())
            table = read_table(target)
            print("O*NET downloaded:", url)
            break
        except Exception as error:
            print(f"O*NET download failed ({type(error).__name__}): {url}")
    if table is None:
        local = [p for p in sources_dir.glob("*") if p.suffix.lower() in (".csv", ".txt", ".xlsx", ".xls")
                 and re.search("software|technology", p.name, re.I)]
        if not local:
            print("O*NET not used. Put the Software Skills file from https://www.onetcenter.org/database.html in", sources_dir)
            return [], set()
        table = read_table(local[0])
        print("O*NET read from", local[0])
    column = next((c for c in table.columns if "example" in str(c).lower()), None)
    column = column or next((c for c in table.columns if "skill" in str(c).lower() or "name" in str(c).lower()), None)
    assert column, f"No skill name column in the O*NET file. Columns: {list(table.columns)}"
    hot_column = next((c for c in table.columns if "hot" in str(c).lower()), None)
    names = table[column].dropna().astype(str)
    hot = set()
    if hot_column:
        flags = table.loc[names.index, hot_column].astype(str).str.strip().str.upper()
        hot = set(names[flags.isin(["Y", "YES", "TRUE", "1"])])
    else:
        print("No hot technology column in the O*NET file, so only the evidence rule can admit O*NET names.")
    return names.tolist(), hot


def normalize(name: str) -> str:
    text = str(name).lower().replace("®", "").replace("™", "")
    text = re.sub(r"\s*\([^)]*\)", "", text)
    text = re.sub(r"\s+(software|programming language|development software|computer software)$", "", text)
    return re.sub(r"\s+", " ", text).lstrip(" ,;").rstrip(" ,.;")


def build_catalog(data_jobs_counts, onet_names, onet_hot, max_words: int) -> pd.DataFrame:
    sources: dict[str, set] = {}
    aliases: dict[str, set] = {}

    def add(name: str, source: str) -> None:
        name = normalize(name)
        if len(name) < 1 or not re.search("[a-z]", name) or len(name.split()) > max_words:
            return
        sources.setdefault(name, set()).add(source)

    for name in data_jobs_counts:
        add(name, "data_jobs")
    for name in onet_names:
        add(name, "onet")
    for name in onet_hot:
        add(name, "onet_hot")
    for name, names in OWN_SKILLS.items():
        add(name, "own")
        for alias in names:
            aliases.setdefault(normalize(name), set()).add(normalize(alias))

    alias_to_skill = {alias: skill for skill, group in aliases.items() for alias in group}
    for name in list(sources):
        if name in alias_to_skill and name != alias_to_skill[name]:
            sources.setdefault(alias_to_skill[name], set()).update(sources.pop(name))

    # "amazon web services aws" is "amazon web services" with its short form attached
    for name in list(sources):
        for alias, skill in alias_to_skill.items():
            if name != skill and name.startswith(skill + " ") and name.endswith(" " + alias):
                sources.setdefault(skill, set()).update(sources.pop(name))
                break

    for risky, (safe, safe_aliases) in RENAME.items():
        if risky in sources:
            sources.setdefault(safe, set()).update(sources.pop(risky) | {"renamed"})
            aliases.setdefault(safe, set()).update(safe_aliases)

    rows = [
        {"skill": name, "aliases": sorted(aliases.get(name, set()) - {name}), "sources": "+".join(sorted(group))}
        for name, group in sources.items()
    ]
    return pd.DataFrame(rows).sort_values("skill").reset_index(drop=True)


def flags_for(name: str, zipf_cutoff: float) -> str:
    from wordfreq import zipf_frequency

    found = []
    if re.fullmatch("[a-z]{1,2}", name):
        found.append("short")
    if re.fullmatch("[a-z]+", name) and len(name) > 2 and zipf_frequency(name, "en") >= zipf_cutoff:
        found.append("common_word")
    return "+".join(found)


def load_tech_postings(cfg: dict) -> pd.DataFrame:
    from datasets import load_dataset

    raw = load_dataset(cfg["skills"]["evidence_dataset"], split="train").to_pandas()
    words = cfg["skills"]["evidence_title_words"]
    pattern = re.compile(r"\b(?:" + "|".join(re.escape(w) for w in words) + r")\b", re.IGNORECASE)
    keep = raw["position_title"].fillna("").astype(str).str.contains(pattern)
    out = raw[keep].reset_index(drop=True)
    out["text"] = out["job_description"].map(tf.clean_text)
    return out


def decisions_so_far(review_file: Path) -> dict:
    decided = dict(DEFAULT_DECISIONS)
    if review_file.exists():
        old = pd.read_csv(review_file, keep_default_na=False)
        decided.update({r.skill: r.decision for r in old.itertuples() if str(r.decision).strip() in ("keep", "drop")})
    return decided


def to_mapping(frame: pd.DataFrame) -> dict[str, str]:
    return tf.load_skills({row.skill: row.aliases for row in frame.itertuples()})


def snippets_for(skill: str, aliases: list, postings: pd.DataFrame, limit: int = 3) -> tuple[int, list]:
    pattern = tf.compile_skill_pattern(tf.load_skills({skill: aliases}))
    hits, shown = 0, []
    for text in postings.text:
        match = pattern.search(text)
        if match:
            hits += 1
            if len(shown) < limit:
                shown.append(text[max(0, match.start() - 45): match.end() + 45])
    return hits, shown


def required_skill_terms(model_response: str) -> list[str]:
    value = ""
    for loader in (json.loads, ast.literal_eval):
        try:
            data = loader(model_response)
            value = data.get("Required Skills", "") if isinstance(data, dict) else ""
            break
        except Exception:
            value = ""
    if not value:
        found = re.search(r"Required Skills\W+(.*?)(?:\"\s*,|$)", str(model_response), re.S)
        value = found.group(1) if found else ""
    text = " ".join(value) if isinstance(value, list) else str(value)
    parts = re.split(r"[,;\n•]| and ", text.lower())
    return [p.strip(" .-:\"'") for p in parts if 2 <= len(p.strip()) <= 30 and len(p.split()) <= 3]


def skills_section_terms(raw_text: str) -> list[str]:
    terms = []
    for start in SECTION_START.finditer(raw_text):
        chunk = raw_text[start.end(): start.end() + 900]
        end = SECTION_END.search(chunk)
        if end:
            chunk = chunk[: end.start()]
        for part in re.split(r"[\n\t,;•|·]| - |\s{3,}", chunk):
            term = part.strip(" .:-\"'*").lower()
            if 2 <= len(term) <= 30 and len(term.split()) <= 4 and not term.isdigit():
                terms.append(term)
    return terms


def run(cfg: dict) -> None:
    os.environ["HF_HUB_DISABLE_PROGRESS_BARS"] = "1"
    os.environ["HF_DATASETS_DISABLE_PROGRESS_BARS"] = "1"

    s = cfg["skills"]
    data_dir, sources_dir = path(cfg, "data_dir"), path(cfg, "sources_dir")
    skills_file, review_file = path(cfg, "skills_file"), path(cfg, "skills_review")
    all_file, report_file = data_dir / "skills_all.csv", data_dir / "skills_report.json"
    resume_csv = path(cfg, "resume_csv")
    if not resume_csv.exists():
        raise SystemExit(f"Resume.csv not found at {resume_csv}. See ml/README.md for where to get it.")
    sources_dir.mkdir(parents=True, exist_ok=True)

    data_jobs_counts = from_data_jobs(cfg)
    onet_names, onet_hot = from_onet(cfg, sources_dir)
    report(
        "Step 1: gather",
        "data_jobs, O*NET, own list",
        f"data_jobs {len(data_jobs_counts)} names, O*NET {len(set(onet_names))} names ({len(onet_hot)} hot), own list {len(OWN_SKILLS)}",
    )

    catalog = build_catalog(data_jobs_counts, onet_names, onet_hot, s["max_words"])
    catalog = catalog[~catalog.skill.isin(GENERIC)].reset_index(drop=True)
    catalog["data_jobs_postings"] = catalog.skill.map(lambda n: data_jobs_counts.get(n, 0))
    catalog["risk"] = catalog.skill.map(lambda n: flags_for(n, s["common_word_zipf"]))
    print(f"{len(catalog)} skills, {(catalog.risk != '').sum()} flagged as risky")

    postings = load_tech_postings(cfg)
    print(f"{len(postings)} tech postings used as evidence")

    decided = decisions_so_far(review_file)
    catalog["decision"] = catalog.skill.map(lambda n: decided.get(n, ""))

    all_map = to_mapping(catalog)
    all_pattern = tf.compile_skill_pattern(all_map)
    evidence = Counter(skill for text in postings.text for skill in tf.find_skills(text, all_pattern, all_map))
    catalog["postings_matched"] = catalog.skill.map(lambda n: evidence.get(n, 0))
    catalog["eligible"] = (
        catalog.sources.str.contains("data_jobs|own|onet_hot") | (catalog.postings_matched >= s["min_onet_evidence"])
    )
    catalog["active"] = catalog.eligible & ((catalog.risk == "") | (catalog.decision == "keep"))
    catalog.loc[catalog.decision == "drop", "active"] = False
    print(f"{len(catalog)} candidates, {int(catalog.eligible.sum())} eligible, {int(catalog.active.sum())} live")

    live_map = to_mapping(catalog[catalog.active])
    live_pattern = tf.compile_skill_pattern(live_map)
    postings["found"] = postings.text.map(lambda t: tf.find_skills(t, live_pattern, live_map))
    counts = postings.found.map(len)
    print(f"Skills found per posting: average {counts.mean():.1f}")
    for k in (1, 3, 5):
        print(f"  postings with at least {k} skill(s): {(counts >= k).mean():.0%}")

    review_rows = []
    for row in catalog[(catalog.risk != "") & catalog.eligible].itertuples():
        hits, shown = snippets_for(row.skill, row.aliases, postings)
        review_rows.append({
            "skill": row.skill, "risk": row.risk, "sources": row.sources, "postings_matched": hits,
            **{f"example_{i + 1}": (shown[i] if i < len(shown) else "") for i in range(3)},
            "decision": row.decision,
        })
    review = pd.DataFrame(review_rows)
    undecided = int((review.decision == "").sum()) if len(review) else 0
    print(f"{len(review)} flagged skills, {undecided} still need a decision")

    gap = Counter()
    if "model_response" in postings:
        for response in postings["model_response"].fillna(""):
            for term in set(required_skill_terms(response)):
                if not tf.find_skills(term, live_pattern, live_map):
                    gap[term] += 1
    print("Terms postings ask for that the list misses:", [f"{t} ({n})" for t, n in gap.most_common(40)])

    resume_raw = pd.read_csv(resume_csv, usecols=["ID", "Resume_str", "Category"]).dropna(subset=["Resume_str"])
    resume_raw = resume_raw[resume_raw.Category.isin(s["resume_categories"])].reset_index(drop=True)
    resume_raw["text"] = resume_raw.Resume_str.map(tf.clean_text)
    resume_raw["found"] = resume_raw.text.map(lambda t: tf.find_skills(t, live_pattern, live_map))
    resume_counts = resume_raw.found.map(len)
    print(f"{len(resume_raw)} resumes read. Skills found per resume: average {resume_counts.mean():.1f}")
    for k in (1, 3, 5):
        print(f"  resumes with at least {k} skill(s): {(resume_counts >= k).mean():.0%}")

    resume_gap = Counter()
    for raw_text in resume_raw.Resume_str:
        for term in set(skills_section_terms(raw_text)):
            if not tf.find_skills(term, live_pattern, live_map):
                resume_gap[term] += 1
    common = [(t, n) for t, n in resume_gap.most_common(80) if n >= s["min_resumes"]]
    print("Terms in resume Skills sections that the list misses:", [f"{t} ({n})" for t, n in common[:50]])

    mentions = postings.text.map(lambda t: bool(YEARS_ANY.search(t)))
    readable = mentions & postings.text.map(lambda t: bool(YEARS_WITH_NUMBER.search(t)))
    years_stats = {
        "postings": int(len(postings)),
        "mention_years_and_experience": round(float(mentions.mean()), 3),
        "years_with_a_readable_number": round(float(readable.mean()), 3),
    }
    print(f"Postings that state a years requirement with a readable number: {readable.mean():.0%}")

    live = catalog[catalog.active]
    skills_file.write_text(json.dumps({row.skill: row.aliases for row in live.itertuples()}, indent=1))
    catalog.to_csv(all_file, index=False)
    review.to_csv(review_file, index=False, encoding="utf-8-sig")
    report_file.write_text(json.dumps({
        "created": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "live_skills": int(len(live)), "all_skills": int(len(catalog)),
        "eligible": int(catalog.eligible.sum()),
        "flagged": int(((catalog.risk != "") & catalog.eligible).sum()),
        "flagged_undecided": int(((catalog.risk != "") & catalog.eligible & (catalog.decision == "")).sum()),
        "sources": {"data_jobs": len(data_jobs_counts), "onet": len(set(onet_names)), "own": len(OWN_SKILLS)},
        "evidence_postings": int(len(postings)),
        "postings_with_3_plus_skills": round(float((counts >= 3).mean()), 3),
        "avg_skills_per_posting": round(float(counts.mean()), 2),
        "resumes_checked": int(len(resume_raw)),
        "avg_skills_per_resume": round(float(resume_counts.mean()), 2),
        "years_requirement": years_stats,
    }, indent=1))
    report(
        "Step 1: save",
        f"{len(catalog)} skills, {len(review)} flagged",
        f"{len(live)} live skills in {skills_file}. {undecided} flagged skills wait for a decision in {review_file.name}.",
    )
