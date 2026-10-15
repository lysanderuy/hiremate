from __future__ import annotations

import argparse
import csv
import json
import math
import random
import sys
from pathlib import Path

import joblib
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import talentflow_features as tf  # noqa: E402

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


def read_pairs(path: Path) -> list[dict]:
    csv.field_size_limit(10**9)
    with path.open(encoding="utf-8", newline="") as handle:
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


def main() -> None:
    parser = argparse.ArgumentParser(description="Export the trained TalentFlow model and golden fixtures for TypeScript.")
    parser.add_argument("--joblib", required=True, type=Path)
    parser.add_argument("--skills", required=True, type=Path)
    parser.add_argument("--pairs-csv", required=True, type=Path)
    parser.add_argument("--out-dir", required=True, type=Path)
    args = parser.parse_args()

    bundle = joblib.load(args.joblib)
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

    raw_skills = json.loads(args.skills.read_text(encoding="utf-8"))
    mapping = tf.load_skills(raw_skills)
    pattern = tf.compile_skill_pattern(mapping)
    lexicon = [{"name": name, "aliases": list(aliases)} for name, aliases in raw_skills.items()]
    names = [entry["name"] for entry in lexicon]

    pairs = read_pairs(args.pairs_csv)
    golden = {
        "lexicon": lexicon,
        "scoring": build_scoring_cases(pipeline, names, 60),
        "features": build_feature_cases(pipeline, coef, scale),
        "extraction": build_extraction_cases(pairs, pattern, mapping),
    }

    out_dir: Path = args.out_dir
    (out_dir / "__fixtures__").mkdir(parents=True, exist_ok=True)
    (out_dir / "model.json").write_text(json.dumps(model, indent=2) + "\n", encoding="utf-8")
    golden_path = out_dir / "__fixtures__" / "golden.json"
    golden_path.write_text(json.dumps(golden, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")

    raws = [c["expected"]["rawRating"] for c in golden["scoring"]]
    print(f"model.json written; golden.json {golden_path.stat().st_size / 1024:.0f} KB")
    print(f"scoring cases: {len(raws)}, raw<0: {sum(r < 0 for r in raws)}, raw>4: {sum(r > 4 for r in raws)}")
    print(f"job with 0 skills: {sum(not c['jobSkills'] for c in golden['scoring'])}, empty resume skills: {sum(not c['resumeSkills'] for c in golden['scoring'])}")
    print(f"feature cases: {len(golden['features'])}")


if __name__ == "__main__":
    main()
