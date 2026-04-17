#!/usr/bin/env python3

from __future__ import annotations

import argparse
import csv
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path


MONITORED_PREFIXES = (
    "src/app/",
    "src/components/",
    "src/lib/",
    "supabase/",
    "scripts/",
    ".github/workflows/",
)
RELEVANT_DOC_PREFIXES = (
    "docs/prd/",
    "docs/testing/",
    "docs/bug-fixes/",
    "docs/engineering/",
)
CANONICAL_PRD_PREFIX = "docs/prd/prd-"
CSV_PATH = "docs/product/feature-system.csv"
TRIVIAL_MAX_CHANGED_LINES = 15


@dataclass
class Change:
    path: str
    status: str
    added: int = 0
    deleted: int = 0

    @property
    def total_changed_lines(self) -> int:
        return self.added + self.deleted

    @property
    def is_added(self) -> bool:
        return self.status.startswith("A")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Enforce release governance requirements for pull requests."
    )
    parser.add_argument(
        "--repo-root",
        default=Path(__file__).resolve().parent.parent,
        type=Path,
        help="Repository root.",
    )
    parser.add_argument(
        "--base-sha",
        default="origin/main",
        help="Base commit or ref for diff comparison.",
    )
    parser.add_argument(
        "--head-sha",
        default="HEAD",
        help="Head commit or ref for diff comparison.",
    )
    return parser.parse_args()


def run_git(repo_root: Path, *args: str) -> str:
    result = subprocess.run(
        ["git", *args],
        cwd=repo_root,
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or "git command failed")
    return result.stdout


def get_diff_range(base_sha: str, head_sha: str) -> str:
    return f"{base_sha}...{head_sha}"


def load_changes(repo_root: Path, diff_range: str) -> dict[str, Change]:
    changes: dict[str, Change] = {}

    name_status_output = run_git(repo_root, "diff", "--name-status", diff_range)
    for raw_line in name_status_output.splitlines():
        if not raw_line.strip():
            continue
        parts = raw_line.split("\t")
        status = parts[0]
        path = parts[-1]
        changes[path] = Change(path=path, status=status)

    numstat_output = run_git(repo_root, "diff", "--numstat", diff_range)
    for raw_line in numstat_output.splitlines():
        if not raw_line.strip():
            continue
        parts = raw_line.split("\t")
        if len(parts) < 3:
            continue
        added_text, deleted_text, path = parts[0], parts[1], parts[-1]
        added = int(added_text) if added_text.isdigit() else 0
        deleted = int(deleted_text) if deleted_text.isdigit() else 0
        change = changes.get(path, Change(path=path, status="M"))
        change.added = added
        change.deleted = deleted
        changes[path] = change

    return changes


def is_docs_file(path: str) -> bool:
    return path.startswith("docs/")


def is_monitored_file(path: str) -> bool:
    return path.startswith(MONITORED_PREFIXES)


def is_relevant_doc_file(path: str) -> bool:
    return path.startswith(RELEVANT_DOC_PREFIXES)


def is_test_file(path: str) -> bool:
    return any(token in path for token in ("/__tests__/", ".test.", ".spec."))


def is_canonical_prd(path: str) -> bool:
    return path.startswith(CANONICAL_PRD_PREFIX) and path.endswith(".md")


def classify_pr(changes: dict[str, Change]) -> tuple[str, list[Change], list[Change], list[str]]:
    changed_paths = list(changes)
    monitored_changes = [change for change in changes.values() if is_monitored_file(change.path)]
    non_test_monitored = [change for change in monitored_changes if not is_test_file(change.path)]
    added_non_test_monitored = [change for change in non_test_monitored if change.is_added]
    new_prd_files = [path for path, change in changes.items() if change.is_added and is_canonical_prd(path)]

    if changed_paths and all(is_docs_file(path) for path in changed_paths):
        return "docs-only", monitored_changes, non_test_monitored, new_prd_files

    if new_prd_files or added_non_test_monitored:
        return "new-feature-or-system", monitored_changes, non_test_monitored, new_prd_files

    if not monitored_changes:
        return "trivial-code-change", monitored_changes, non_test_monitored, new_prd_files

    only_tests = non_test_monitored == []
    single_small_modification = (
        len(non_test_monitored) == 1
        and not non_test_monitored[0].is_added
        and not non_test_monitored[0].path.startswith(("supabase/", ".github/workflows/"))
        and non_test_monitored[0].total_changed_lines <= TRIVIAL_MAX_CHANGED_LINES
    )

    if only_tests or single_small_modification:
        return "trivial-code-change", monitored_changes, non_test_monitored, new_prd_files

    return "material-feature-change", monitored_changes, non_test_monitored, new_prd_files


def run_csv_validator(repo_root: Path) -> tuple[bool, str]:
    result = subprocess.run(
        [sys.executable, "scripts/validate-feature-system-csv.py"],
        cwd=repo_root,
        capture_output=True,
        text=True,
        check=False,
    )
    return result.returncode == 0, result.stdout + result.stderr


def load_csv_mappings(repo_root: Path) -> dict[str, str]:
    mappings: dict[str, str] = {}
    csv_path = repo_root / CSV_PATH
    with csv_path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            mappings[row["prd_file"]] = row["prd_id"]
    return mappings


def fail(message: str, extra: str | None = None) -> int:
    print(f"FAIL: {message}")
    if extra:
        print("")
        print(extra.strip())
    return 1


def main() -> int:
    args = parse_args()
    repo_root = args.repo_root.resolve()
    diff_range = get_diff_range(args.base_sha, args.head_sha)

    try:
        changes = load_changes(repo_root, diff_range)
    except RuntimeError as exc:
        return fail(f"Unable to inspect PR diff for range {diff_range}", str(exc))

    csv_ok, csv_output = run_csv_validator(repo_root)
    if not csv_ok:
        return fail("docs/product/feature-system.csv validation failed", csv_output)

    classification, monitored_changes, non_test_monitored, new_prd_files = classify_pr(changes)
    changed_paths = sorted(changes)
    relevant_doc_updates = [path for path in changed_paths if is_relevant_doc_file(path)]
    csv_changed = CSV_PATH in changes

    print(f"classification: {classification}")
    if changed_paths:
        print("changed files:")
        for path in changed_paths:
            print(f"- {path}")

    if classification == "docs-only":
        print("PASS: Docs-only change")
        return 0

    if classification == "trivial-code-change":
        print("PASS: Trivial code change with no governance artifacts required")
        return 0

    if classification == "new-feature-or-system":
        if not new_prd_files:
            return fail("New feature/system change detected but no canonical PRD found in docs/prd/")
        if not csv_changed:
            return fail("PRD added but feature-system.csv was not updated")

        csv_mappings = load_csv_mappings(repo_root)
        for prd_file in new_prd_files:
            if prd_file not in csv_mappings:
                return fail(
                    f"PRD added but feature-system.csv is missing a mapping for {prd_file}"
                )

        if not relevant_doc_updates:
            return fail("New feature/system change detected but no supporting docs were updated")

        print("PASS: New feature/system change includes PRD, CSV alignment, and supporting docs")
        return 0

    if monitored_changes and not relevant_doc_updates:
        return fail("Material feature change detected but no supporting docs were updated")

    print("PASS: Material feature change includes required supporting docs and valid governance artifacts")
    return 0


if __name__ == "__main__":
    sys.exit(main())
