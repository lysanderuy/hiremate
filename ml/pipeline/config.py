import sys
from pathlib import Path

if sys.version_info >= (3, 11):
    import tomllib
else:
    import tomli as tomllib

ROOT = Path(__file__).resolve().parents[2]
CONFIG_FILE = ROOT / "ml" / "config.toml"


def load() -> dict:
    with CONFIG_FILE.open("rb") as handle:
        return tomllib.load(handle)


def path(cfg: dict, key: str) -> Path:
    return ROOT / cfg["paths"][key]
