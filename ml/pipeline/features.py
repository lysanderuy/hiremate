import sys

from .config import ROOT

sys.path.insert(0, str(ROOT / "matcher"))
import talentflow_features as tf  # noqa: E402

__all__ = ["tf"]
