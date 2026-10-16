import json
import shutil
from datetime import datetime, timezone

import joblib
import numpy as np
import pandas as pd
import sklearn
from scipy.stats import spearmanr
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

from .config import path
from . import plots
from .features import tf
from .util import bar, report

BANDS = ["Strong", "Fair", "Weak"]


def to_band(rating: float) -> str:
    return tf.score_to_band(tf.relevance_to_score(rating))


def score_system(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    y_pred = np.clip(y_pred, 0, tf.RELEVANCE_MAX)
    return {
        "MAE": mean_absolute_error(y_true, y_pred),
        "Spearman": spearmanr(y_true, y_pred).statistic,
        "Within 1": float(np.mean(np.abs(y_true - y_pred) <= 1)),
        "Band match": float(np.mean([to_band(a) == to_band(b) for a, b in zip(y_true, y_pred)])),
    }


def make_ridge(alpha: float):
    return make_pipeline(StandardScaler(), Ridge(alpha=alpha))


def show_table(rows: dict) -> pd.DataFrame:
    table = pd.DataFrame(rows).T.round(3)
    table["Within 1"] = (table["Within 1"] * 100).round(0).astype(int).astype(str) + "%"
    table["Band match"] = (table["Band match"] * 100).round(0).astype(int).astype(str) + "%"
    return table


def run(cfg: dict) -> dict:
    dataset_dir, model_dir = path(cfg, "dataset_dir"), path(cfg, "model_dir")
    dataset_csv = dataset_dir / "training_dataset.csv"
    if not dataset_csv.exists():
        raise SystemExit(f"{dataset_csv} not found. Run the split stage first.")
    model_dir.mkdir(parents=True, exist_ok=True)

    data = pd.read_csv(dataset_csv)
    needed = ["pair_id", "resume_id", "split", "rating", *tf.FEATURES]
    missing = [c for c in needed if c not in data.columns]
    assert not missing, f"training_dataset.csv is missing columns: {missing}"
    data = data.dropna(subset=["rating"]).reset_index(drop=True)
    assert set(data.split) == {"train", "validation", "test"}, f"unexpected split values: {set(data.split)}"

    part = {name: data[data.split == name].reset_index(drop=True) for name in ("train", "validation", "test")}
    X = {name: frame[tf.FEATURES].to_numpy(dtype=float) for name, frame in part.items()}
    y = {name: frame.rating.to_numpy(dtype=float) for name, frame in part.items()}
    report(
        "Step 4: load",
        str(dataset_csv),
        ", ".join(f"{name} {len(frame)} pairs ({frame.resume_id.nunique()} resumes)" for name, frame in part.items()),
    )

    low, high, count = cfg["train"]["alpha_logspace"]
    tries, train_tries = {}, {}
    for alpha in np.logspace(low, high, count):
        fitted = make_ridge(alpha).fit(X["train"], y["train"])
        tries[alpha] = mean_absolute_error(y["validation"], np.clip(fitted.predict(X["validation"]), 0, tf.RELEVANCE_MAX))
        train_tries[alpha] = mean_absolute_error(y["train"], np.clip(fitted.predict(X["train"]), 0, tf.RELEVANCE_MAX))
    best_alpha = min(tries, key=tries.get)
    print(f"Alphas tried: {len(tries)}. Best on validation: {best_alpha:.2f} (MAE {tries[best_alpha]:.3f})")

    ridge_train = make_ridge(best_alpha).fit(X["train"], y["train"])
    X_both = np.vstack([X["train"], X["validation"]])
    y_both = np.concatenate([y["train"], y["validation"]])
    ridge_final = make_ridge(best_alpha).fit(X_both, y_both)
    print(f"Final model fitted on {len(X_both)} pairs (train {len(X['train'])} + validation {len(X['validation'])})\n")

    validation_scores = {"ridge": score_system(y["validation"], ridge_train.predict(X["validation"]))}
    test_pred = ridge_final.predict(X["test"])
    test_scores = {"ridge": score_system(y["test"], test_pred)}
    print("Validation (Ridge fitted on train only):")
    print(show_table(validation_scores).to_string(), "\n")
    print("Test (Ridge fitted on train + validation):")
    results = show_table(test_scores)
    print(results.to_string(), "\n")

    ridge_test = np.clip(test_pred, 0, tf.RELEVANCE_MAX)
    bands = pd.DataFrame({"actual": [to_band(v) for v in y["test"]], "model says": [to_band(v) for v in ridge_test]})
    print("Bands on test (rows actual, columns model):")
    band_counts = pd.crosstab(bands["actual"], bands["model says"]).reindex(index=BANDS, columns=BANDS, fill_value=0)
    print(band_counts, "\n")

    weights = pd.Series(ridge_final[-1].coef_, index=tf.FEATURES).sort_values(key=abs, ascending=False)
    biggest = weights.abs().max()
    print("Weights:")
    for name, value in weights.items():
        print(f"  {name:20s} {bar(abs(value) / biggest)} {value:+.3f}")
    print()

    trained_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    run_dir = model_dir / "runs" / datetime.fromisoformat(trained_at).strftime("%Y%m%dT%H%M%SZ")
    run_dir.mkdir(parents=True, exist_ok=True)

    plots.predicted_vs_actual(y["test"], ridge_test, tf.RELEVANCE_MAX, run_dir / "plot_predicted_vs_actual.png")
    plots.band_table(band_counts, run_dir / "plot_bands.png")
    plots.weights(weights, run_dir / "plot_weights.png")
    alphas = list(tries)
    plots.alpha_curve(alphas, [train_tries[a] for a in alphas], [tries[a] for a in alphas], best_alpha, run_dir / "plot_alpha_curve.png")

    order = np.random.default_rng(0).permutation(len(X["train"]))
    sizes = sorted({max(20, int(len(order) * share)) for share in np.linspace(0.2, 1.0, 7)})
    curve_train, curve_val = [], []
    for n in sizes:
        pick = order[:n]
        fitted = make_ridge(best_alpha).fit(X["train"][pick], y["train"][pick])
        curve_train.append(mean_absolute_error(y["train"][pick], np.clip(fitted.predict(X["train"][pick]), 0, tf.RELEVANCE_MAX)))
        curve_val.append(mean_absolute_error(y["validation"], np.clip(fitted.predict(X["validation"]), 0, tf.RELEVANCE_MAX)))
    plots.learning_curve(sizes, curve_train, curve_val, run_dir / "plot_learning_curve.png")

    train_mae = mean_absolute_error(y["train"], np.clip(ridge_train.predict(X["train"]), 0, tf.RELEVANCE_MAX))
    plots.split_scores(
        ["Train", "Validation", "Test"],
        [train_mae, validation_scores["ridge"]["MAE"], test_scores["ridge"]["MAE"]],
        run_dir / "plot_split_scores.png",
    )
    plots.residuals(ridge_test - y["test"], run_dir / "plot_residuals.png")
    levels = np.round(y["test"]).astype(int)
    grouped = pd.Series(ridge_test).groupby(levels).agg(["mean", "count"])
    plots.calibration(grouped.index.to_numpy(), grouped["mean"].to_numpy(), grouped["count"].to_numpy(), tf.RELEVANCE_MAX, run_dir / "plot_calibration.png")

    artifact = {
        "model": ridge_final,
        "features": tf.FEATURES,
        "model_name": "ridge",
        "alpha": float(best_alpha),
        "relevance_max": tf.RELEVANCE_MAX,
        "band_cutoffs": tf.BAND_CUTOFFS,
        "embedding_model": tf.MODEL_NAME,
        "chunk_words": tf.CHUNK_WORDS,
        "sklearn_version": sklearn.__version__,
        "trained_at": trained_at,
    }
    joblib_file = model_dir / "relevance_model.joblib"
    joblib.dump(artifact, joblib_file)

    card = {
        "trained_at": trained_at,
        "model": "ridge",
        "alpha": float(best_alpha),
        "features": tf.FEATURES,
        "pairs": {name: int(len(frame)) for name, frame in part.items()},
        "sklearn_version": sklearn.__version__,
        "validation": {k: {m: float(v) for m, v in s.items()} for k, s in validation_scores.items()},
        "test": {k: {m: float(v) for m, v in s.items()} for k, s in test_scores.items()},
    }
    (model_dir / "model_card.json").write_text(json.dumps(card, indent=1))
    results.to_csv(model_dir / "test_results.csv")
    shutil.copy(dataset_dir / "split_summary.csv", model_dir / "split_summary.csv")

    for name in ["relevance_model.joblib", "model_card.json", "test_results.csv", "split_summary.csv"]:
        shutil.copy2(model_dir / name, run_dir / name)

    loaded = joblib.load(joblib_file)
    assert np.allclose(loaded["model"].predict(X["test"][:20]), ridge_final.predict(X["test"][:20])), "reloaded model gives different answers"
    report("Step 4: save", f"Ridge, alpha {best_alpha:.2f}", f"{joblib_file}, model_card.json, test_results.csv, split_summary.csv. Charts and a copy of this run: {run_dir}")
    return card
