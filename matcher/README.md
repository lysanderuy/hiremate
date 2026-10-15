# Hiremate matcher

Small FastAPI service that turns resume and listing text into SBERT embeddings. Skill extraction and scoring run in TypeScript (`src/lib/matching`); this service only embeds.

## Install

```bash
python -m venv matcher/.venv
matcher/.venv/Scripts/activate        # Windows; use source matcher/.venv/bin/activate elsewhere
pip install torch --index-url https://download.pytorch.org/whl/cpu   # CPU-only build, much smaller; skip on Windows/macOS dev if torch is already installed
pip install -r matcher/requirements.txt
cp matcher/.env.example matcher/.env  # then set MATCHER_API_KEY
```

## Run

```bash
npm run matcher:dev   # http://localhost:8000
npm run dev:all       # Next.js and the matcher together
```

The service refuses to start without `MATCHER_API_KEY`. The model downloads on first start.

## Contract

`GET /health` (no auth) returns `{ "status": "ok", "model": "all-MiniLM-L6-v2", "dim": 384 }`.

`POST /embed` with header `x-api-key: <MATCHER_API_KEY>`:

```json
{ "kind": "resume" | "listing", "texts": ["..."] }
```

1 to 16 texts, each 1 to 200000 characters and at most 400000 in total. Returns `{ "model", "dim", "embeddings": number[][] }` with one length-1 vector per text. Wrong key returns 401, invalid body 422.

Text prep happens inside the service. Resumes use `clean_text` only. Listings are lowercased with digits and punctuation deleted (see `prep_listing`) to match the training data.

## Retrain and export

After retraining, copy the new `relevance_model.joblib`, `skills.json`, `pairs_text.csv` and `talentflow_features.py` from the training folder (the last one into `matcher/`), then regenerate the TypeScript model and golden fixtures (needs `pip install -r matcher/requirements-tools.txt`):

```bash
python matcher/tools/export_model.py \
  --joblib <ML>/relevance_model.joblib --skills <ML>/skills.json \
  --pairs-csv <ML>/pairs_text.csv --out-dir src/lib/matching
npx prettier --write src/lib/matching/model.json src/lib/matching/__fixtures__/golden.json
npm test
```

This rewrites `src/lib/matching/model.json` and `src/lib/matching/__fixtures__/golden.json`. Stored embeddings must be recomputed if the embedding model or text prep changes.
