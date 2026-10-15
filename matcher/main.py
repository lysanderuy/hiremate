from __future__ import annotations

import hmac
import os
import re
from contextlib import asynccontextmanager
from typing import Annotated, Literal

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, Field, model_validator
from sentence_transformers import SentenceTransformer

import talentflow_features as tf

load_dotenv()

API_KEY = os.environ.get("MATCHER_API_KEY")
if not API_KEY or API_KEY == "change-me" or len(API_KEY) < 16:
    raise RuntimeError(
        "MATCHER_API_KEY is missing, still the placeholder, or shorter than 16 characters. "
        "Copy matcher/.env.example to matcher/.env and set a real key."
    )

MAX_TEXT_CHARS = 200_000
MAX_TOTAL_CHARS = 400_000


# Training job texts are lowercase with every digit and punctuation mark deleted (not replaced by a space).
def prep_listing(text: str) -> str:
    text = re.sub(r"[0-9]", "", text.lower())
    text = re.sub(r"[^\w\s]", "", text)
    return tf.clean_text(text)


class EmbedRequest(BaseModel):
    kind: Literal["resume", "listing"]
    texts: list[Annotated[str, Field(min_length=1, max_length=MAX_TEXT_CHARS)]] = Field(min_length=1, max_length=16)

    @model_validator(mode="after")
    def total_size_within_budget(self):
        if sum(len(text) for text in self.texts) > MAX_TOTAL_CHARS:
            raise ValueError(f"texts must total at most {MAX_TOTAL_CHARS} characters")
        return self


class EmbedResponse(BaseModel):
    model: str
    dim: int
    embeddings: list[list[float]]


class HealthResponse(BaseModel):
    status: Literal["ok"]
    model: str
    dim: int


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.model = SentenceTransformer(tf.MODEL_NAME)
    app.state.dim = app.state.model.get_sentence_embedding_dimension()
    yield


app = FastAPI(title="Hiremate matcher", lifespan=lifespan)


def require_api_key(x_api_key: Annotated[str | None, Header()] = None) -> None:
    if x_api_key is None or not hmac.compare_digest(x_api_key.encode(), API_KEY.encode()):
        raise HTTPException(status_code=401, detail="Invalid API key")


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", model=tf.MODEL_NAME, dim=app.state.dim)


@app.post("/embed", response_model=EmbedResponse, dependencies=[Depends(require_api_key)])
def embed(body: EmbedRequest) -> EmbedResponse:
    prepare = tf.clean_text if body.kind == "resume" else prep_listing
    vectors = tf.embed_texts(app.state.model, [prepare(text) for text in body.texts])
    return EmbedResponse(model=tf.MODEL_NAME, dim=app.state.dim, embeddings=vectors.tolist())
