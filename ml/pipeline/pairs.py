import json
import logging
import os
import re
import shutil
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
from scipy.stats import spearmanr

from .config import path
from .features import tf
from .util import report, title_pattern

RUBRIC = """Rating guide (how well does this resume fit this job?)

0  Not relevant. Different field or role. Nothing in the resume fits the job.
1  Weak. Same broad area, but the resume misses most of what the job asks for.
2  Partial. Some of the skills and experience the job asks for, with clear gaps or the wrong level.
3  Good. Most of what the job asks for is there. Small gaps only.
4  Strong. Nearly everything the job asks for is there, at the right level.

Rules
- Judge only what is written in the resume and the job posting. Do not guess at skills that are not written.
- Rate the fit to this job only. Do not rate how good the resume is.
- Ignore the name, gender, age, school name and company names.
- Use the whole scale. If you are between two numbers, pick the lower one.
- If a text is unreadable, leave the rating empty.
- Write a number from 0 to 4 in the rating column. Do not change the other columns.
"""


def load_resumes(file: Path, p: dict, tech: re.Pattern, exclude: re.Pattern) -> pd.DataFrame:
    id_col, text_col, cat_col = p["id_col"], p["text_col"], p["category_col"]
    raw = pd.read_csv(file, usecols=[id_col, text_col, cat_col]).dropna(subset=[text_col])
    text = raw[text_col].map(tf.clean_text)
    in_category = raw[cat_col].isin(p["tech_categories"])
    head = text.str[: p["title_chars"]]
    by_title = head.str.contains(tech) & ~head.str.contains(exclude) & ~in_category
    if not p["pick_tech_by_title"]:
        by_title = by_title & False
    keep = in_category | by_title
    return pd.DataFrame(
        {
            "resume_id": raw[id_col][keep].to_numpy(),
            "category": raw[cat_col][keep].to_numpy(),
            "picked_by": np.where(in_category[keep], "category", "title"),
            "text": text[keep].to_numpy(),
        }
    ).drop_duplicates("resume_id").reset_index(drop=True)


def load_jobs(dataset: str) -> pd.DataFrame:
    from datasets import load_dataset

    raw = load_dataset(dataset, split="train").to_pandas()
    jobs = pd.DataFrame(
        {
            "job_id": raw.index,
            "title": raw["position_title"].fillna("").astype(str),
            "company": raw["company_name"].fillna("").astype(str),
            "text": raw["job_description"].map(tf.clean_text),
        }
    )
    return jobs[jobs.text.str.len() > 0].reset_index(drop=True)


def overlap_matrix(resume_skills, job_skills) -> np.ndarray:
    names = sorted(set().union(*resume_skills, *job_skills))
    index = {name: n for n, name in enumerate(names)}

    def binary(sets) -> np.ndarray:
        out = np.zeros((len(sets), len(names)), dtype=np.float32)
        for row, found in enumerate(sets):
            for name in found:
                out[row, index[name]] = 1
        return out

    resume_bin, job_bin = binary(list(resume_skills)), binary(list(job_skills))
    needed = job_bin.sum(axis=1)
    with np.errstate(invalid="ignore", divide="ignore"):
        return (resume_bin @ job_bin.T) / needed[None, :]


def level(values: np.ndarray, edges) -> np.ndarray:
    low_cut, high_cut = np.quantile(values[~np.isnan(values)], edges)
    return np.where(values > high_cut, "high", np.where(values > low_cut, "mid", "low"))


# leftover pairs go to a cell by chance, weighted by how much it was rounded down
def split_quota(quota: int, mix: dict, rng) -> dict:
    raw = {name: quota * share for name, share in mix.items()}
    counts = {name: int(value) for name, value in raw.items()}
    leftover = quota - sum(counts.values())
    names = list(raw)
    weights = np.array([raw[n] - counts[n] for n in names])
    if leftover > 0 and weights.sum() > 0:
        for name in rng.choice(names, size=leftover, replace=False, p=weights / weights.sum()):
            counts[name] += 1
    return counts


def build_cells(sim: np.ndarray, overlap: np.ndarray, edges) -> np.ndarray:
    cells = np.char.add(
        np.char.add(level(sim, edges), "/"),
        np.where(np.isnan(overlap), "x", level(np.nan_to_num(overlap), edges)),
    )
    cells = np.where(np.isnan(overlap), "no_skills", cells)
    return cells.astype(object)


def draw_pairs(cells: np.ndarray, p: dict, rng) -> tuple[list, dict]:
    n_resumes, n_jobs = cells.shape
    job_uses = np.zeros(n_jobs, dtype=int)
    resume_uses = np.zeros(n_resumes, dtype=int)
    chosen: dict = {}
    wanted = split_quota(p["total_pairs"], p["grid_weights"], rng)
    missing = {}

    def draw(pool: np.ndarray, k: int, label: str) -> int:
        got = 0
        for row in rng.permutation(len(pool)):
            if got == k:
                break
            i, j = int(pool[row][0]), int(pool[row][1])
            if (i, j) in chosen or job_uses[j] >= p["max_job_uses"] or resume_uses[i] >= p["max_resume_uses"]:
                continue
            chosen[(i, j)] = label
            job_uses[j] += 1
            resume_uses[i] += 1
            got += 1
        return got

    for name, k in wanted.items():
        if name == "random":
            continue
        got = draw(np.argwhere(cells == name), k, name)
        if got < k:
            missing[name] = k - got
    extra = wanted.get("random", 0) + sum(missing.values())
    got = draw(np.argwhere(np.ones(cells.shape, dtype=bool)), extra, "random")
    return [(i, j, label) for (i, j), label in chosen.items()], {"wanted": wanted, "missing": missing, "random_short": extra - got}


# new pairs reuse the ids p0001... so old ratings and datasets must not stay in place
def retire_old_dataset(cfg: dict, out_dir: Path, labels_file: Path) -> None:
    old = [out_dir / n for n in ("label_sheet.csv", "pairs_features.csv", "pairs_text.csv", "training_dataset.csv", "split_summary.csv")]
    old = [f for f in [*old, labels_file] if f.exists()]
    if not old:
        return
    target = path(cfg, "backup_dir") / (datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ") + "-pairs")
    target.mkdir(parents=True, exist_ok=True)
    for file in old:
        shutil.move(str(file), str(target / file.name))
    print(f"Moved the old sheet, ratings and dataset to {target}")


def run(cfg: dict, force: bool = False) -> None:
    os.environ["HF_HUB_DISABLE_PROGRESS_BARS"] = "1"
    os.environ["HF_DATASETS_DISABLE_PROGRESS_BARS"] = "1"
    logging.getLogger("huggingface_hub").setLevel(logging.ERROR)

    p = cfg["pairs"]
    out_dir, labels_file = path(cfg, "dataset_dir"), path(cfg, "labels_file")
    sheet_file = out_dir / "label_sheet.csv"
    if (sheet_file.exists() or labels_file.exists()) and not force:
        raise SystemExit(
            f"Refusing to run: {sheet_file.name} or the filled labels already exist. "
            "Running this again draws new pairs and loses the ratings. Pass --force to overwrite."
        )
    resume_csv, skills_file = path(cfg, "resume_csv"), path(cfg, "skills_file")
    if not resume_csv.exists():
        raise SystemExit(f"Resume.csv not found at {resume_csv}. See ml/README.md for where to get it.")
    if not skills_file.exists():
        raise SystemExit(f"{skills_file} not found. Run the skills stage first.")
    assert abs(sum(p["grid_weights"].values()) - 1) < 1e-9, "grid_weights should add up to 1"
    out_dir.mkdir(parents=True, exist_ok=True)
    if force:
        retire_old_dataset(cfg, out_dir, labels_file)

    tech, exclude = title_pattern(p["tech_title_words"]), title_pattern(p["tech_title_exclude"])
    resumes = load_resumes(resume_csv, p, tech, exclude)
    assert len(resumes) > 0, f"No resumes in {p['tech_categories']}. Check the category names in Resume.csv."
    by_category = int((resumes.picked_by == "category").sum())
    report("Step 2: tech resumes", resume_csv.name, f"{len(resumes)} resumes: {by_category} by category, {len(resumes) - by_category} by title")

    skill_map = tf.load_skills(json.loads(skills_file.read_text()))
    skill_pattern = tf.compile_skill_pattern(skill_map)
    resumes["skills"] = resumes.text.map(lambda t: tf.find_skills(t, skill_pattern, skill_map))

    all_jobs = load_jobs(p["jobs_dataset"])
    all_jobs["skills"] = all_jobs.text.map(lambda t: tf.find_skills(t, skill_pattern, skill_map))
    is_tech = all_jobs.title.str.contains(tech) & ~all_jobs.title.str.contains(exclude)
    jobs = all_jobs[is_tech].reset_index(drop=True)
    assert len(jobs) > 0, "No tech postings found. Check tech_title_words."
    if len(jobs) < p["min_tech_jobs"]:
        print(f"WARNING: only {len(jobs)} tech postings. Pairs will reuse the same jobs a lot.")
    report("Step 2: tech jobs", f"{len(all_jobs)} postings", f"{len(jobs)} kept")

    from sentence_transformers import SentenceTransformer

    print("Embedding every resume and job. This is the slow step.")
    model = SentenceTransformer(tf.MODEL_NAME)
    resume_vecs = tf.embed_texts(model, resumes.text)
    job_vecs = tf.embed_texts(model, jobs.text)
    cosine = resume_vecs @ job_vecs.T

    overlap = overlap_matrix(resumes.skills, jobs.skills)
    cells = build_cells(cosine, overlap, p["grid_edges"])
    rng = np.random.default_rng(p["seed"])
    picked, info = draw_pairs(cells, p, rng)

    rows = []
    for i, j, cell in picked:
        features = tf.pair_features(resumes.skills[i], jobs.skills[j], cosine[i, j])
        rows.append(
            {
                "resume_id": resumes.resume_id[i],
                "job_id": jobs.job_id[j],
                "resume_category": resumes.category[i],
                "picked_by": resumes.picked_by[i],
                "job_title": jobs.title[j],
                "job_company": jobs.company[j],
                "cell_sampled": cell,
                **features,
            }
        )
    pairs = pd.DataFrame(rows)
    pairs.insert(0, "pair_id", [f"p{n:04d}" for n in range(1, len(pairs) + 1)])
    pairs["_resume_row"] = [i for i, _, _ in picked]
    pairs["_job_row"] = [j for _, j, _ in picked]
    report("Step 2: pick pairs", f"{p['total_pairs']} wanted", f"{len(pairs)} pairs from {pairs.resume_id.nunique()} resumes and {pairs.job_id.nunique()} jobs")

    got = pairs.cell_sampled.value_counts()
    print(pd.DataFrame({"wanted": pd.Series(info["wanted"]), "got": got}).fillna(0).astype(int).to_string())
    if info["missing"]:
        print("Cells with too few pairs, filled with random pairs:", info["missing"])
    if info["random_short"] > 0:
        print(f"WARNING: {info['random_short']} pairs could not be drawn. max_job_uses or max_resume_uses is too tight.")
    both = ~np.isnan(overlap)
    all_corr = spearmanr(cosine[both], overlap[both]).statistic
    used = pairs.job_skill_count > 0
    sample_corr = spearmanr(pairs.sbert_cosine[used], pairs.skills_overlap[used]).statistic
    print(f"Similarity vs overlap (1 = same thing): all pairs {all_corr:+.2f}, sample {sample_corr:+.2f}")

    (out_dir / "labeling_rubric.txt").write_text(RUBRIC)
    order = rng.permutation(len(pairs))
    mine = pairs.iloc[order]
    max_chars = p["max_chars"]
    sheet = pd.DataFrame(
        {
            "pair_id": mine.pair_id.to_numpy(),
            "job_title": mine.job_title.to_numpy(),
            "job_company": mine.job_company.to_numpy(),
            "job_text": jobs.text.iloc[mine["_job_row"]].str[:max_chars].to_numpy(),
            "resume_text": resumes.text.iloc[mine["_resume_row"]].str[:max_chars].to_numpy(),
        }
    )
    sheet["rating"] = ""
    sheet.to_csv(sheet_file, index=False, encoding="utf-8-sig")
    pd.DataFrame(
        {
            "pair_id": pairs.pair_id,
            "resume_text": resumes.text.iloc[pairs["_resume_row"]].to_numpy(),
            "job_text": jobs.text.iloc[pairs["_job_row"]].to_numpy(),
        }
    ).to_csv(out_dir / "pairs_text.csv", index=False)

    keep = [
        "pair_id", "resume_id", "job_id", "job_title", "job_company", "resume_category", "picked_by", "cell_sampled",
        *tf.FEATURES,
    ]
    pairs[keep].to_csv(out_dir / "pairs_features.csv", index=False)
    (out_dir / "skills_used.json").write_text(json.dumps(skill_map, indent=1))
    (out_dir / "config_used.json").write_text(
        json.dumps(
            {
                "created": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                "model": tf.MODEL_NAME,
                "chunk_words": tf.CHUNK_WORDS,
                "features": tf.FEATURES,
                "tech_categories": p["tech_categories"],
                "total_pairs": len(pairs),
                "grid_weights": p["grid_weights"],
                "seed": p["seed"],
            },
            indent=1,
        )
    )
    report(
        "Step 2: label sheet",
        f"{len(pairs)} pairs",
        f"{sheet_file} written. Fill the rating column (0 to 4), save it as {labels_file}, then run the split stage.",
    )
