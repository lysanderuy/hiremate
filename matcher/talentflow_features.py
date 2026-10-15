"""Shared feature code for TalentFlow AI.

Three places use this file: the dataset prep notebook, the training notebook,
and later the FastAPI service. They must call these same functions, so the
features the model was trained on are the features it sees in the live system.
If you change anything here, rebuild the dataset and retrain the model.
"""

from __future__ import annotations

import re

import numpy as np

# ---------- settings that are part of the model ----------

MODEL_NAME = "all-MiniLM-L6-v2"
CHUNK_WORDS = 150  # the model reads about 256 word pieces, so long texts get split

# the columns the trained model reads, in this exact order
FEATURES = [
    "sbert_cosine",
    "skills_overlap",
    "matched_count",
    "job_skill_count",
    "resume_skill_count",
]

# the human rating goes from 0 to RELEVANCE_MAX
RELEVANCE_MAX = 4
BAND_CUTOFFS = {"strong": 70, "fair": 40}  # score at or above the cutoff

# the old hand-set formula (PRD 6.4), kept only as a baseline to beat
FORMULA_LOW = 0.15
FORMULA_HIGH = 0.65
FORMULA_SKILLS_WEIGHT = 0.4
FORMULA_MEANING_WEIGHT = 0.6


# ---------- text ----------


# any run of whitespace becomes one space
def clean_text(text) -> str:
    return " ".join(str(text).split())


# ---------- skills ----------


# accepts a list of skill names, or a dict {name: [aliases]}
# returns {alias or name: canonical name}, all lowercase
def load_skills(raw) -> dict[str, str]:
    mapping: dict[str, str] = {}
    items = raw.items() if isinstance(raw, dict) else ((name, []) for name in raw)
    for name, aliases in items:
        canonical = str(name).strip().lower()
        if not canonical:
            continue
        mapping[canonical] = canonical
        for alias in aliases or []:
            alias = str(alias).strip().lower()
            if alias and alias not in mapping:
                mapping[alias] = canonical
    if not mapping:
        raise ValueError("the skills list is empty")
    return mapping


# the skills as a prefix tree, turned into one regex. A plain "a|b|c" over thousands of skills is very slow,
# a tree checks each letter once. The optional ending is greedy, so "power bi" wins over "power".
def _tree_pattern(node: dict) -> str:
    branches = [re.escape(char) + _tree_pattern(node[char]) for char in sorted(k for k in node if k)]
    if not branches:
        return ""
    body = branches[0] if len(branches) == 1 and "" not in node else "(?:" + "|".join(branches) + ")"
    if "" in node:  # a skill can also end here
        body = "(?:" + body + ")?" if not body.startswith("(?:") else body + "?"
    return body


def compile_skill_pattern(mapping: dict[str, str]) -> re.Pattern:
    root: dict = {}
    for name in mapping:
        node = root
        for char in name:
            node = node.setdefault(char, {})
        node[""] = True
    return re.compile(rf"(?<![\w+#])(?:{_tree_pattern(root)})(?![\w+#])", re.IGNORECASE)


# the set of skills (canonical names) found in a text
def find_skills(text: str, pattern: re.Pattern, mapping: dict[str, str]) -> set[str]:
    return {mapping[match.lower()] for match in pattern.findall(text)}


# ---------- meaning (SBERT) ----------


def split_chunks(text: str, size: int = CHUNK_WORDS) -> list[str]:
    words = text.split()
    return [" ".join(words[i : i + size]) for i in range(0, len(words), size)] or [""]


# one vector per text: embed each chunk, average per text, scale to length 1
# model is a SentenceTransformer (anything with .encode works)
def embed_texts(model, texts, batch_size: int = 64) -> np.ndarray:
    texts = list(texts)
    chunks, owners = [], []
    for i, text in enumerate(texts):
        parts = split_chunks(text)
        chunks += parts
        owners += [i] * len(parts)

    vectors = model.encode(chunks, batch_size=batch_size, normalize_embeddings=True, show_progress_bar=False)
    owners = np.array(owners)

    sums = np.zeros((len(texts), vectors.shape[1]))
    np.add.at(sums, owners, vectors)
    means = sums / np.bincount(owners, minlength=len(texts))[:, None]
    return means / np.maximum(np.linalg.norm(means, axis=1, keepdims=True), 1e-12)


# ---------- features for one resume and job pair ----------


# if the job lists no skills, skills_overlap is 0 and job_skill_count is 0
# (the missing skills are job_skills minus resume_skills. They are shown to the user but are not a model input)
def pair_features(resume_skills: set, job_skills: set, cosine: float) -> dict:
    matched = resume_skills & job_skills
    return {
        "sbert_cosine": float(cosine),
        "skills_overlap": len(matched) / len(job_skills) if job_skills else 0.0,
        "matched_count": len(matched),
        "job_skill_count": len(job_skills),
        "resume_skill_count": len(resume_skills),
    }


# the feature values as a list, in the order the model expects
def feature_vector(features: dict) -> list[float]:
    return [float(features[name]) for name in FEATURES]


# ---------- rating, score and band ----------


# the old formula on the 0 to RELEVANCE_MAX scale. Only used as a baseline.
# A job with no skills (job_skill_count 0) is scored on meaning alone.
def formula_baseline(sbert_cosine, skills_overlap, job_skill_count):
    cosine = np.asarray(sbert_cosine, dtype=float)
    overlap = np.asarray(skills_overlap, dtype=float)
    no_skills = np.asarray(job_skill_count, dtype=float) == 0
    meaning = np.clip((cosine - FORMULA_LOW) / (FORMULA_HIGH - FORMULA_LOW), 0, 1)
    blended = np.where(
        no_skills,
        meaning,
        FORMULA_SKILLS_WEIGHT * overlap + FORMULA_MEANING_WEIGHT * meaning,
    )
    return blended * RELEVANCE_MAX


# a predicted rating (0 to RELEVANCE_MAX) becomes a whole score from 0 to 100
def relevance_to_score(relevance) -> int:
    clipped = min(max(float(relevance), 0.0), RELEVANCE_MAX)
    return int(np.floor(clipped * 100 / RELEVANCE_MAX + 0.5))


def score_to_band(score: float) -> str:
    if score >= BAND_CUTOFFS["strong"]:
        return "Strong"
    if score >= BAND_CUTOFFS["fair"]:
        return "Fair"
    return "Weak"
