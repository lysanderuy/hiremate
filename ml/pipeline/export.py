import csv
import json
import math
import random
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np

from .config import ROOT, path
from .features import tf

SEED = 20260514
DIM = 8
EXTRACTION_SAMPLE = 25
EXTRACTION_CHARS = 2000


def unit(vec: np.ndarray) -> np.ndarray:
    return vec / np.linalg.norm(vec)


def correlated_pair(rng: np.random.Generator, target: float) -> tuple[np.ndarray, np.ndarray]:
    a = unit(rng.normal(size=DIM))
    noise = rng.normal(size=DIM)
    noise = unit(noise - noise.dot(a) * a)
    b = unit(target * a + math.sqrt(max(1 - target * target, 0.0)) * noise)
    return a, b


def predict_raw(pipeline, features: dict) -> float:
    return float(pipeline.predict(np.array([tf.feature_vector(features)]))[0])


def score_fields(raw: float) -> dict:
    score = tf.relevance_to_score(raw)
    return {
        "rating": min(max(raw, 0.0), float(tf.RELEVANCE_MAX)),
        "score": score,
        "band": tf.score_to_band(score).lower(),
    }


def build_scoring_cases(pipeline, lexicon_names: list[str], count: int) -> list[dict]:
    rng = np.random.default_rng(SEED)
    pyrng = random.Random(SEED)
    cases: list[dict] = []
    job_sizes = [0, 0, 1, 2, 3, 5, 8, 12, 20, 35]
    targets = [-0.9, -0.5, -0.1, 0.0, 0.15, 0.3, 0.45, 0.55, 0.65, 0.8, 0.95, 1.0]

    for i in range(count):
        target = targets[i % len(targets)]
        job_size = job_sizes[i % len(job_sizes)]
        job_skills = pyrng.sample(lexicon_names, job_size)
        resume_size = 0 if i % 17 == 5 else pyrng.choice([2, 5, 10, 18, 30, 45])
        keep = pyrng.random()
        resume_skills = [s for s in job_skills if pyrng.random() < keep][:resume_size]
        extras = [s for s in pyrng.sample(lexicon_names, resume_size) if s not in job_skills]
        resume_skills = list(dict.fromkeys(resume_skills + extras))[: max(resume_size, 0)]
        pyrng.shuffle(resume_skills)

        resume_vec, job_vec = correlated_pair(rng, target)
        cosine = float(np.dot(resume_vec, job_vec))
        features = tf.pair_features(set(resume_skills), set(job_skills), cosine)
        raw = predict_raw(pipeline, features)
        resume_set = set(resume_skills)
        cases.append(
            {
                "resumeSkills": resume_skills,
                "jobSkills": job_skills,
                "resumeEmbedding": resume_vec.tolist(),
                "jobEmbedding": job_vec.tolist(),
                "expected": {
                    "cosine": cosine,
                    "features": features,
                    "rawRating": raw,
                    **score_fields(raw),
                    "matched": [s for s in job_skills if s in resume_set],
                    "missing": [s for s in job_skills if s not in resume_set],
                },
            }
        )
    return cases


def feature_case(pipeline, features: dict) -> dict:
    raw = predict_raw(pipeline, features)
    return {"features": features, "expected": {"rawRating": raw, **score_fields(raw)}}


def build_feature_cases(pipeline, coef: np.ndarray, scale: np.ndarray) -> list[dict]:
    def feats(cosine, overlap, matched, job_count, resume_count) -> dict:
        return {
            "sbert_cosine": cosine,
            "skills_overlap": overlap,
            "matched_count": matched,
            "job_skill_count": job_count,
            "resume_skill_count": resume_count,
        }

    cases = [
        feats(0.0, 0.0, 0, 0, 0),
        feats(1.0, 1.0, 10, 10, 10),
        feats(-1.0, 0.0, 0, 30, 0),
        feats(0.9, 1.0, 40, 40, 80),
        feats(0.05, 0.0, 0, 50, 2),
        feats(0.52, 0.22, 1, 6, 11),
        feats(0.7, 0.5, 4, 8, 20),
        feats(0.3, 0.1, 1, 10, 25),
        feats(1.0, 1.0, 100, 100, 200),
        feats(-0.5, 0.0, 0, 100, 0),
    ]

    # rating is linear in sbert_cosine, so solve for the cosine that lands a rating exactly on a rounding edge
    others = feats(0.0, 0.4, 3, 8, 12)
    base = predict_raw(pipeline, others)
    slope = coef[0] / scale[0]
    for target_score in (10, 33, 39, 40, 41, 55, 69, 70, 71, 90):
        edge_rating = (target_score - 0.5) * tf.RELEVANCE_MAX / 100
        for delta in (-1e-6, 1e-6):
            cosine = (edge_rating + delta - base) / slope
            cases.append({**others, "sbert_cosine": float(cosine)})

    return [feature_case(pipeline, case) for case in cases]


def read_pairs(file: Path) -> list[dict]:
    csv.field_size_limit(10**9)
    with file.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def extraction_case(text: str, pattern, mapping, note: str | None = None, from_clean: bool = False) -> dict:
    source = tf.clean_text(text) if from_clean else text
    case = {"text": text, "expected": sorted(tf.find_skills(source, pattern, mapping))}
    if note:
        case["note"] = note
    return case


def build_extraction_cases(pairs: list[dict], pattern, mapping) -> dict:
    rng = random.Random(SEED)
    resumes = rng.sample([row["resume_text"][:EXTRACTION_CHARS] for row in pairs], EXTRACTION_SAMPLE)
    jobs = rng.sample([row["job_text"][:EXTRACTION_CHARS] for row in pairs], EXTRACTION_SAMPLE)

    handcrafted = [
        ("Strong in C++ and C# development.", None, False),
        ("Built services with Node.js and ASP.NET on the .NET platform.", None, False),
        ("Owns the CI/CD pipeline and builds Power BI dashboards.", None, False),
        ("Ships with C++17, C#9 and python3 only; not C+ or C##.", "digits glued to a skill block it", False),
        ("Worked on machine\nlearning and power\n  bi reports.", "multi-word skill split by a newline; expected from clean_text", True),
        ("PYTHON, REACT AND POSTGRESQL EXPERIENCE", "uppercase", False),
        ("Knows cpp, csharp, nodejs, dotnet and powerbi.", "aliases", False),
        ("Naïve café résumé: python and react", "accents away from skills", False),
        ("Développeur python, éreact, reactté, résuméreact", "accented letters adjacent to a skill", False),
        ("python-react; (sql) [aws] \"docker\" git/github", "punctuation boundaries", False),
        ("Built services with Spring Framework and Spring Boot.", "an entry name beats another entry's alias", False),
    ]
    return {
        "resumes": [extraction_case(text, pattern, mapping) for text in resumes],
        "jobs": [extraction_case(text, pattern, mapping) for text in jobs],
        "handcrafted": [extraction_case(text, pattern, mapping, note, clean) for text, note, clean in handcrafted],
    }


# extraction already lets an entry name beat another entry's alias, so dropping these changes nothing
def drop_colliding_aliases(raw: dict) -> tuple[dict, list[str]]:
    seen = set(raw)
    clean, dropped = {}, []
    for name, aliases in raw.items():
        kept = []
        for alias in aliases:
            if alias in seen:
                dropped.append(f"{alias} (alias of {name})")
                continue
            seen.add(alias)
            kept.append(alias)
        clean[name] = kept
    return clean, dropped


# same rules as scripts/seed-skills.mjs
def validate_seed(seed: list[dict]) -> list[str]:
    errors, seen = [], {}
    for entry in seed:
        for term in [entry["name"], *entry["aliases"]]:
            if term != term.lower():
                errors.append(f"{entry['name']}: {term!r} must be lowercase")
            if not 2 <= len(term) <= 40:
                errors.append(f"{entry['name']}: {term!r} must be 2 to 40 characters")
            if term in seen:
                errors.append(f"{entry['name']}: {term!r} is already used by {seen[term]!r}")
            else:
                seen[term] = entry["name"]
    return errors


def build_files(joblib_file: Path, skills_file: Path, pairs_csv: Path) -> tuple[dict, dict, list[dict], list[str]]:
    bundle = joblib.load(joblib_file)
    pipeline = bundle["model"]
    scaler, ridge = pipeline[0], pipeline[-1]
    if list(bundle["features"]) != tf.FEATURES:
        raise SystemExit(f"feature order mismatch: {bundle['features']} vs {tf.FEATURES}")

    coef = np.asarray(ridge.coef_, dtype=float).ravel()
    mean = np.asarray(scaler.mean_, dtype=float)
    scale = np.asarray(scaler.scale_, dtype=float)
    intercept = float(np.ravel(ridge.intercept_)[0])

    model = {
        "trainedAt": str(bundle["trained_at"]),
        "embeddingModel": str(bundle["embedding_model"]),
        "chunkWords": int(bundle["chunk_words"]),
        "relevanceMax": float(bundle["relevance_max"]),
        "bandCutoffs": {k: int(v) for k, v in bundle["band_cutoffs"].items()},
        "features": list(bundle["features"]),
        "mean": mean.tolist(),
        "scale": scale.tolist(),
        "coef": coef.tolist(),
        "intercept": intercept,
    }

    raw_skills, dropped = drop_colliding_aliases(json.loads(skills_file.read_text(encoding="utf-8")))
    mapping = tf.load_skills(raw_skills)
    pattern = tf.compile_skill_pattern(mapping)
    lexicon = [{"name": name, "aliases": list(aliases)} for name, aliases in raw_skills.items()]
    names = [entry["name"] for entry in lexicon]

    golden = {
        "lexicon": lexicon,
        "scoring": build_scoring_cases(pipeline, names, 60),
        "features": build_feature_cases(pipeline, coef, scale),
        "extraction": build_extraction_cases(read_pairs(pairs_csv), pattern, mapping),
    }
    seed = [{"name": e["name"], "aliases": e["aliases"], "isActive": True} for e in lexicon]
    errors = validate_seed(seed)
    if errors:
        problems = "\n- ".join(errors)
        raise SystemExit(f"The skills list would fail npm run db:seed-skills. Fix ml/data/skills.json:\n- {problems}")
    return model, golden, seed, dropped


def write_files(model_file: Path, golden_file: Path, seed_file: Path, model: dict, golden: dict, seed: list[dict]) -> None:
    for file in (model_file, golden_file, seed_file):
        file.parent.mkdir(parents=True, exist_ok=True)
    model_file.write_text(json.dumps(model, indent=2) + "\n", encoding="utf-8")
    golden_file.write_text(json.dumps(golden, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    seed_file.write_text(json.dumps(seed, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def backup(files: list[Path], backup_root: Path) -> Path | None:
    existing = [f for f in files if f.exists()]
    if not existing:
        return None
    target = backup_root / datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    for file in existing:
        dest = target / file.relative_to(ROOT)
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(file, dest)
    return target


def describe_skill_changes(old: list[dict] | None, new: list[dict]) -> None:
    if old is None:
        print("Skills list: no previous seed file.")
        return
    old_map = {e["name"]: sorted(e.get("aliases", [])) for e in old}
    new_map = {e["name"]: sorted(e["aliases"]) for e in new}
    added = [n for n in new_map if n not in old_map]
    removed = [n for n in old_map if n not in new_map]
    aliased = [n for n in new_map if n in old_map and new_map[n] != old_map[n]]
    if not (added or removed or aliased):
        print("Skills list: unchanged.")
        return
    print(f"Skills list changed: {len(added)} added, {len(removed)} removed, {len(aliased)} with new aliases.")
    for label, names in (("added", added), ("removed", removed), ("aliases changed", aliased)):
        if names:
            print(f"  {label}: {', '.join(names[:30])}{' ...' if len(names) > 30 else ''}")
    print("Remap the skills on existing listings by hand if the list changed.")


def npx() -> str | None:
    return shutil.which("npx")


def run(cfg: dict, run_tests: bool = False) -> None:
    model_dir, dataset_dir = path(cfg, "model_dir"), path(cfg, "dataset_dir")
    joblib_file = model_dir / "relevance_model.joblib"
    skills_file, pairs_csv = path(cfg, "skills_file"), dataset_dir / "pairs_text.csv"
    for needed in (joblib_file, skills_file, pairs_csv):
        if not needed.exists():
            raise SystemExit(f"{needed} not found. Run the earlier stages first.")

    model_file, golden_file, seed_file = path(cfg, "app_model"), path(cfg, "app_golden"), path(cfg, "app_skills")
    old_seed = json.loads(seed_file.read_text(encoding="utf-8")) if seed_file.exists() else None

    model, golden, seed, dropped = build_files(joblib_file, skills_file, pairs_csv)
    if dropped:
        print(f"Dropped {len(dropped)} alias(es) that collide with another skill: {', '.join(dropped)}")
    saved = backup([model_file, golden_file, seed_file], path(cfg, "backup_dir"))
    write_files(model_file, golden_file, seed_file, model, golden, seed)
    print(f"Backup of the old files: {saved if saved else 'none (nothing to back up)'}")

    raws = [c["expected"]["rawRating"] for c in golden["scoring"]]
    print(f"Wrote {model_file.relative_to(ROOT)}, {golden_file.relative_to(ROOT)}, {seed_file.relative_to(ROOT)}")
    print(f"scoring cases {len(raws)} (raw<0: {sum(r < 0 for r in raws)}, raw>4: {sum(r > 4 for r in raws)}), feature cases {len(golden['features'])}")

    tool = npx()
    if tool:
        files = [str(f.relative_to(ROOT)) for f in (model_file, golden_file, seed_file)]
        pretty = subprocess.run([tool, "prettier", "--write", *files], cwd=ROOT)
        if pretty.returncode != 0:
            print("Prettier failed. Run it by hand on the exported files.")
    else:
        print("npx not found, so prettier was not run. Run it by hand on the exported files.")

    describe_skill_changes(old_seed, seed)

    if run_tests:
        if not tool:
            raise SystemExit("npx not found, cannot run the parity tests.")
        result = subprocess.run([tool, "vitest", "run"], cwd=ROOT)
        print("Parity tests:", "PASS" if result.returncode == 0 else "FAIL")
        if result.returncode != 0:
            where = f"copy the files from {saved} back to the same paths" if saved else "restore them with git"
            raise SystemExit(f"Parity tests failed. To undo the export, {where}.")
    else:
        print("Parity tests not run. Use --test or run: npx vitest run")
