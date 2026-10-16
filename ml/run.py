import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from pipeline import config  # noqa: E402


def main() -> None:
    shared = argparse.ArgumentParser(add_help=False)
    shared.add_argument("--test", action="store_true", help="run npx vitest run after export")

    parser = argparse.ArgumentParser(description="Local training pipeline. No command runs split, train and export.", parents=[shared])
    sub = parser.add_subparsers(dest="command")
    sub.add_parser("skills", help="stage 1: build the skills list")
    pairs = sub.add_parser("pairs", help="stage 2: draw the pairs and write the rating sheet")
    pairs.add_argument("--force", action="store_true", help="overwrite an existing label sheet")
    sub.add_parser("split", help="stage 3: check ratings, split, write training_dataset.csv")
    sub.add_parser("train", help="stage 4: train and evaluate")
    sub.add_parser("export", parents=[shared], help="stage 5: export into the app")
    sub.add_parser("run", parents=[shared], help="stages 3 to 5 (default)")
    args = parser.parse_args()

    cfg = config.load()
    command = args.command or "run"

    if command == "skills":
        from pipeline import skills_list

        skills_list.run(cfg)
    elif command == "pairs":
        from pipeline import pairs as pairs_stage

        pairs_stage.run(cfg, force=args.force)
    elif command in ("split", "run"):
        from pipeline import split

        split.run(cfg)
    if command in ("train", "run"):
        from pipeline import train

        train.run(cfg)
    if command in ("export", "run"):
        from pipeline import export

        export.run(cfg, run_tests=args.test)


if __name__ == "__main__":
    main()
