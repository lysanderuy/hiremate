import re


def report(step: str, given: str, got: str) -> None:
    print(f"=== {step} ===\nIN : {given}\nOUT: {got}\n")


def bar(share: float, width: int = 20) -> str:
    filled = round(max(0.0, min(share, 1.0)) * width)
    return "#" * filled + "." * (width - filled)


def title_pattern(words: list[str]) -> re.Pattern:
    return re.compile(r"\b(?:" + "|".join(re.escape(w) for w in words) + r")s?\b", re.IGNORECASE)
