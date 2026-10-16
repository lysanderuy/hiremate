# ml: training pipeline

Trains the matching model on your machine (CPU only) and exports it into the app. Run everything from the repo root.

## Setup

Python 3.10 to 3.13. 3.12 is recommended. scikit-learn is pinned to 1.6.1 to match the saved model.

PowerShell:

```powershell
py -3.12 -m venv ml\.venv
ml\.venv\Scripts\Activate.ps1
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install -r ml\requirements.txt
```

cmd:

```bat
py -3.12 -m venv ml\.venv
ml\.venv\Scripts\activate.bat
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install -r ml\requirements.txt
```

macOS / Linux:

```bash
python3.12 -m venv ml/.venv
source ml/.venv/bin/activate
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install -r ml/requirements.txt
```

Torch is only used by the `pairs` stage. The default command does not need it.

## Usual run

```
python ml/run.py
```

Runs split, train and export on the ratings already in `ml/data/dataset/labels_done/labels_filled.csv`. Add `--test` to run `npx vitest run` after export and print PASS or FAIL.

## Stages

Each one runs on its own: `python ml/run.py <stage>`.

| Stage    | What it does                                                                           |
| -------- | -------------------------------------------------------------------------------------- |
| `skills` | Builds `ml/data/skills.json` and `skills_review.csv`                                   |
| `pairs`  | Draws 600 pairs, writes the rating sheet                                               |
| `split`  | Checks ratings, splits 70/15/15 by resume, writes `training_dataset.csv`               |
| `train`  | Ridge only. Picks alpha on validation, refits on train + validation, prints the report |
| `export` | Writes the app files (see below)                                                       |

`pairs` refuses to run if a label sheet or filled labels already exist, because it would draw new pairs and lose the ratings. `--force` overrides that.

Order for a fresh dataset: `skills`, `pairs`, rate the sheet by hand, save it as `ml/data/dataset/labels_done/labels_filled.csv` (it needs `pair_id` and `rating`), then `python ml/run.py`.

For the skills stage, fill the `decision` column of `ml/data/skills_review.csv` with `keep` or `drop` and run `skills` again. Decisions are kept between runs.

## Inputs

Paths and settings are in `ml/config.toml`, relative to the repo root.

| File                  | Source                                                                                                         |
| --------------------- | -------------------------------------------------------------------------------------------------------------- |
| `ml/data/Resume.csv`  | Kaggle dataset `snehaanbhawal/resume-dataset`. Download by hand and put it here.                               |
| Job postings          | Hugging Face `lukebarousse/data_jobs` and `jacob-hugging-face/job-descriptions`. Downloaded automatically.     |
| O*NET software skills | Downloaded automatically. If that fails, put the file from onetcenter.org/database.html in `ml/data/sources/`. |

## Outputs

Training writes to `ml/outputs/`: `relevance_model.joblib`, `model_card.json`, `test_results.csv` and `split_summary.csv` (always the latest run, and what export uses). Eight charts are saved in `ml/outputs/runs/<timestamp>/`.

| Chart                          | Shows                                                               |
| ------------------------------ | ------------------------------------------------------------------- |
| `plot_predicted_vs_actual.png` | Test pairs against the perfect line                                 |
| `plot_bands.png`               | Strong, Fair, Weak: actual vs model                                 |
| `plot_weights.png`             | What the model relies on                                            |
| `plot_alpha_curve.png`         | Overfitting check: train vs validation error across alpha           |
| `plot_learning_curve.png`      | Overfitting check: train vs validation error as training data grows |
| `plot_split_scores.png`        | MAE on train, validation and test                                   |
| `plot_residuals.png`           | Spread of test errors                                               |
| `plot_calibration.png`         | Whether the average prediction rises with the real rating           |

Each run folder also holds a copy of the model, card and results, so older runs are kept.

Export overwrites these app files:

- `src/lib/matching/model.json`
- `src/lib/matching/__fixtures__/golden.json`
- `src/db/seeds/skills.json`

Before writing, it drops any alias that is also another skill's name (the name wins in extraction anyway) and checks the seed against the same rules as `npm run db:seed-skills`. It runs prettier on the files after writing. It does not run the database seed. If the skills list changed, it prints what changed. Reseed with `npm run db:seed-skills` and remap listings' skills by hand.

`talentflow_features.py` stays in `matcher/`. The pipeline imports it from there, so training and the matcher use one copy.

## Undo a bad export

Before overwriting, export copies the old files to `ml/backups/<timestamp>/`, under the same paths. Copy them back to restore.

## In git

Committed: config, code, `skills.json`, `skills_review.csv`, the ratings, `pairs_features.csv`, `training_dataset.csv`.

Not committed, so a `git pull` does not bring them:

| Item                                           | What to do                                                                                                                                  |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `ml/.venv/`                                    | Create it with the setup steps above.                                                                                                       |
| `ml/data/Resume.csv` (54 MB)                   | Only the `skills` and `pairs` stages need it. Download it from Kaggle and put it in `ml/data/`.                                             |
| `ml/data/dataset/pairs_text.csv` (6 MB)        | Export needs it to build the golden examples. Get a copy from whoever has it. Without it, `split` and `train` still run and `export` stops. |
| `ml/data/dataset/label_sheet.csv` (6 MB)       | Only needed to hand out a blank rating sheet. The ratings are already committed.                                                            |
| `ml/data/sources/`                             | The O*NET file. The `skills` stage downloads it again.                                                                                      |
| `ml/data/skills_all.csv`, `skills_report.json` | Rewritten by the `skills` stage.                                                                                                            |
| `ml/outputs/`, `ml/backups/`                   | Created by the first run.                                                                                                                   |

If `pairs_text.csv` is lost, the only way to rebuild it is `pairs --force`, which draws new pairs and does not match the committed ratings.

## After you pull

1. Make the venv and install the requirements.
2. Run `python ml/run.py split` and `python ml/run.py train`. They need only committed files.
3. Add `pairs_text.csv` before running `export` or the full `python ml/run.py`.
