from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402
from matplotlib.colors import LinearSegmentedColormap  # noqa: E402

SURFACE, INK, MUTED, GRID = "#fcfcfb", "#0b0b0b", "#52514e", "#e1e0d9"
BLUE, ORANGE = "#2a78d6", "#eb6834"
RAMP = LinearSegmentedColormap.from_list("blue", ["#cde2fb", "#9ec5f4", "#5598e7", "#256abf", "#0d366b"])


def style(ax) -> None:
    ax.set_facecolor(SURFACE)
    for side in ("top", "right"):
        ax.spines[side].set_visible(False)
    for side in ("left", "bottom"):
        ax.spines[side].set_color(GRID)
    ax.tick_params(colors=MUTED, labelsize=9)
    ax.xaxis.label.set_color(MUTED)
    ax.yaxis.label.set_color(MUTED)
    ax.title.set_color(INK)


def save(fig, file: Path) -> None:
    fig.patch.set_facecolor(SURFACE)
    fig.tight_layout()
    fig.savefig(file, dpi=150, facecolor=SURFACE)
    plt.close(fig)


def predicted_vs_actual(y_true, y_pred, relevance_max: float, file: Path) -> None:
    rng = np.random.default_rng(0)
    fig, ax = plt.subplots(figsize=(5.5, 5))
    jitter = rng.uniform(-0.12, 0.12, len(y_true))
    ax.scatter(y_true + jitter, y_pred, s=28, color=BLUE, alpha=0.6, edgecolor=SURFACE, linewidth=0.8)
    ax.plot([0, relevance_max], [0, relevance_max], color=MUTED, linewidth=1, linestyle="--")
    ax.set_xlabel("Actual rating")
    ax.set_ylabel("Predicted rating")
    ax.set_title("Test set: predicted vs actual", loc="left", fontsize=11)
    ax.set_xlim(-0.4, relevance_max + 0.4)
    ax.set_ylim(-0.4, relevance_max + 0.4)
    ax.grid(color=GRID, linewidth=0.6)
    ax.set_axisbelow(True)
    style(ax)
    save(fig, file)


def band_table(table, file: Path) -> None:
    values = table.to_numpy()
    fig, ax = plt.subplots(figsize=(4.8, 4))
    ax.imshow(values, cmap=RAMP, vmin=0, vmax=max(values.max(), 1))
    ax.set_xticks(range(values.shape[1]), labels=list(table.columns))
    ax.set_yticks(range(values.shape[0]), labels=list(table.index))
    ax.set_xlabel("Model says")
    ax.set_ylabel("Actual")
    ax.set_title("Test set: bands", loc="left", fontsize=11)
    for i in range(values.shape[0]):
        for j in range(values.shape[1]):
            dark = values[i, j] > values.max() * 0.5
            ax.text(j, i, int(values[i, j]), ha="center", va="center", fontsize=11, color="#fcfcfb" if dark else INK)
    style(ax)
    ax.spines["left"].set_visible(False)
    ax.spines["bottom"].set_visible(False)
    save(fig, file)


def weights(series, file: Path) -> None:
    series = series.sort_values(key=abs)
    fig, ax = plt.subplots(figsize=(6.5, 3.6))
    colors = [BLUE if v >= 0 else ORANGE for v in series.values]
    ax.barh(series.index, series.values, color=colors, height=0.55)
    span = max(abs(series.values).max(), 1e-9)
    for i, v in enumerate(series.values):
        ax.text(v + (0.02 * span if v >= 0 else -0.02 * span), i, f"{v:+.3f}", va="center",
                ha="left" if v >= 0 else "right", fontsize=9, color=INK)
    ax.axvline(0, color=MUTED, linewidth=1)
    ax.set_xlim(-span * 1.3, span * 1.3)
    ax.set_xlabel("Change in predicted rating per standard deviation of the feature")
    ax.set_title("Model weights (blue raises the rating, orange lowers it)", loc="left", fontsize=11)
    style(ax)
    save(fig, file)


def alpha_curve(alphas, train_mae, validation_mae, best: float, file: Path) -> None:
    fig, ax = plt.subplots(figsize=(6.5, 4))
    ax.plot(alphas, train_mae, color=BLUE, linewidth=2, label="Train")
    ax.plot(alphas, validation_mae, color=ORANGE, linewidth=2, label="Validation")
    ax.axvline(best, color=MUTED, linewidth=1, linestyle="--")
    ax.text(best, ax.get_ylim()[1], f" best alpha {best:.2g}", va="top", fontsize=9, color=INK)
    ax.set_xscale("log")
    ax.set_xlabel("Alpha (higher = simpler model)")
    ax.set_ylabel("MAE (rating points)")
    ax.set_title("Overfitting check: error vs alpha", loc="left", fontsize=11)
    ax.legend(frameon=False, labelcolor=INK)
    ax.grid(color=GRID, linewidth=0.6)
    ax.set_axisbelow(True)
    style(ax)
    save(fig, file)


def learning_curve(sizes, train_mae, validation_mae, file: Path) -> None:
    fig, ax = plt.subplots(figsize=(6.5, 4))
    ax.plot(sizes, train_mae, color=BLUE, linewidth=2, marker="o", markersize=5, label="Train")
    ax.plot(sizes, validation_mae, color=ORANGE, linewidth=2, marker="o", markersize=5, label="Validation")
    ax.set_xlabel("Training pairs used")
    ax.set_ylabel("MAE (rating points)")
    ax.set_title("Overfitting check: error vs training size", loc="left", fontsize=11)
    ax.legend(frameon=False, labelcolor=INK)
    ax.grid(color=GRID, linewidth=0.6)
    ax.set_axisbelow(True)
    style(ax)
    save(fig, file)


def split_scores(labels, values, file: Path) -> None:
    fig, ax = plt.subplots(figsize=(5.5, 3.8))
    ax.bar(labels, values, color=BLUE, width=0.5)
    for i, v in enumerate(values):
        ax.text(i, v + max(values) * 0.02, f"{v:.3f}", ha="center", fontsize=10, color=INK)
    ax.set_ylabel("MAE (rating points)")
    ax.set_title("Error by split (lower is better)", loc="left", fontsize=11)
    ax.set_ylim(0, max(values) * 1.2)
    style(ax)
    save(fig, file)


def residuals(errors, file: Path) -> None:
    fig, ax = plt.subplots(figsize=(6, 4))
    ax.hist(errors, bins=20, color=BLUE, edgecolor=SURFACE, linewidth=1)
    ax.axvline(0, color=MUTED, linewidth=1, linestyle="--")
    ax.set_xlabel("Predicted minus actual rating")
    ax.set_ylabel("Pairs")
    ax.set_title("Test set: prediction errors", loc="left", fontsize=11)
    style(ax)
    save(fig, file)


def calibration(levels, means, counts, relevance_max: float, file: Path) -> None:
    fig, ax = plt.subplots(figsize=(5.5, 4.5))
    ax.plot([0, relevance_max], [0, relevance_max], color=MUTED, linewidth=1, linestyle="--")
    ax.plot(levels, means, color=BLUE, linewidth=2, marker="o", markersize=7)
    for x, y, n in zip(levels, means, counts):
        ax.text(x, y - 0.18, f"n={n}", ha="center", fontsize=8, color=MUTED)
    ax.set_xlabel("Actual rating (rounded)")
    ax.set_ylabel("Average predicted rating")
    ax.set_title("Test set: does the average rise with the rating?", loc="left", fontsize=11)
    ax.grid(color=GRID, linewidth=0.6)
    ax.set_axisbelow(True)
    style(ax)
    save(fig, file)
