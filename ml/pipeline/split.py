import numpy as np
import pandas as pd
from scipy.stats import spearmanr

from .config import path
from .features import tf
from .util import bar, report

RATING_RANGE = range(0, tf.RELEVANCE_MAX + 1)


def load_labels(file) -> pd.DataFrame:
    if not file.exists():
        raise SystemExit(f"Ratings not found at {file}. Fill the rating column of the label sheet and save it there.")
    sheet = pd.read_csv(file)
    missing = [c for c in ["pair_id", "rating"] if c not in sheet.columns]
    if missing:
        raise SystemExit(f"The ratings file is missing columns: {missing}")
    return sheet[["pair_id", "rating"]]


def check_labels(sheet: pd.DataFrame, known_ids: set) -> pd.DataFrame:
    ratings = sheet.copy()
    ratings["rating"] = pd.to_numeric(ratings["rating"], errors="coerce")
    ratings = ratings[ratings["rating"].notna()].reset_index(drop=True)
    problems = []
    out_of_range = ~ratings["rating"].between(min(RATING_RANGE), max(RATING_RANGE))
    if out_of_range.any():
        problems.append(f"ratings outside 0 to 4:\n{ratings[out_of_range].head(10)}")
    if (~ratings.pair_id.isin(known_ids)).any():
        problems.append("pair_ids that are not in pairs_features.csv")
    if ratings.pair_id.duplicated().any():
        problems.append(f"pair_ids that appear twice: {ratings.pair_id[ratings.pair_id.duplicated()].head(10).tolist()}")
    if problems:
        raise SystemExit("Fix these in the ratings file and run again:\n\n" + "\n\n".join(problems))
    return ratings


# resumes are shuffled, then each goes to the part furthest below its target number of pairs
def assign_split(pairs_table: pd.DataFrame, shares: dict, seed: int) -> pd.Series:
    rng = np.random.default_rng(seed)
    sizes = pairs_table.resume_id.value_counts()
    target = {name: share * len(pairs_table) for name, share in shares.items()}
    filled = {name: 0 for name in shares}
    where = {}
    for resume in rng.permutation(sizes.index.to_numpy()):
        part = max(target, key=lambda name: target[name] - filled[name])
        where[resume] = part
        filled[part] += int(sizes[resume])
    return pairs_table.resume_id.map(where)


def run(cfg: dict) -> None:
    out_dir = path(cfg, "dataset_dir")
    shares = cfg["split"]["shares"]
    assert abs(sum(shares.values()) - 1) < 1e-9, "split shares should add up to 1"
    features_file = out_dir / "pairs_features.csv"
    if not features_file.exists():
        raise SystemExit(f"{features_file} not found. Run the pairs stage first.")

    pairs_table = pd.read_csv(features_file)
    ratings = check_labels(load_labels(path(cfg, "labels_file")), set(pairs_table.pair_id))
    if len(ratings) < len(pairs_table):
        print(f"{len(ratings)} of {len(pairs_table)} pairs are rated. Only these are used.")
        pairs_table = pairs_table[pairs_table.pair_id.isin(ratings.pair_id)].reset_index(drop=True)
    if len(ratings) < 50:
        print(f"Warning: only {len(ratings)} rated pairs. The test part will be very small.")

    dataset = pairs_table.merge(ratings, on="pair_id", how="inner")
    dataset["split"] = assign_split(dataset, shares, cfg["split"]["seed"])
    assert dataset.groupby("resume_id").split.nunique().max() == 1, "a resume is in two parts"

    summary = dataset.groupby("split").agg(
        pairs=("pair_id", "count"),
        resumes=("resume_id", "nunique"),
        mean_rating=("rating", "mean"),
        share_3_or_more=("rating", lambda r: (r >= 2.5).mean()),
    ).reindex(list(shares)).round(2)
    print(summary.to_string())
    summary.to_csv(out_dir / "split_summary.csv")

    columns = [
        "pair_id", "resume_id", "job_id", "job_title", "job_company", "resume_category", "picked_by", "cell_sampled", "split",
        *tf.FEATURES, "rating",
    ]
    dataset = dataset[columns]
    dataset.to_csv(out_dir / "training_dataset.csv", index=False)
    report("Step 3: training dataset", f"{len(pairs_table)} rated pairs", f"{len(dataset)} rows in {out_dir / 'training_dataset.csv'}")

    counts = dataset.rating.round().astype(int).value_counts().reindex(list(RATING_RANGE), fill_value=0)
    print("Rating spread (rounded):")
    for rating, n in counts.items():
        print(f"  {rating}  {bar(n / max(len(dataset), 1))} {n}")
    print("Feature vs rating (Spearman):")
    for name in tf.FEATURES:
        print(f"  {name:20s} {spearmanr(dataset[name], dataset.rating).statistic:+.2f}")
    if len(dataset) < 300:
        print("Under 300 rows. Expect modest accuracy.")
    if counts.max() / max(len(dataset), 1) > 0.5:
        print("Over half of the ratings are one number. Pick more varied pairs, or check the rubric.")
    if counts.loc[[3, 4]].sum() / max(len(dataset), 1) < 0.1:
        print("Few 3s and 4s. The model will not learn what a strong match looks like.")
