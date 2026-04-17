#!/usr/bin/env python3

from __future__ import annotations

import argparse
import csv
import re
import sys
from datetime import datetime
from pathlib import Path


EXPECTED_HEADER = [
    "Layer",
    "Feature Name",
    "Priority",
    "Status",
    "Description",
    "Owner",
    "Dependency",
    "Build Order",
    "Decision",
    "Last Updated",
    "prd_id",
    "prd_file",
]

PRD_ID_RE = re.compile(r"^PRD-\d+$")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
PRD_FILE_RE = re.compile(r"^docs/prd/prd-(\d+)-.+\.md$")
PRD_FILENAME_RE = re.compile(r"^prd-(\d+)-.+\.md$")


def is_valid_date(value: str) -> bool:
    if value == "":
        return True
    if not DATE_RE.match(value):
        return False
    try:
        datetime.strptime(value, "%Y-%m-%d")
    except ValueError:
        return False
    return True


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Validate docs/product/feature-system.csv against the repo PRD layer."
    )
    parser.add_argument(
        "--repo-root",
        default=Path(__file__).resolve().parent.parent,
        type=Path,
        help="Repository root to validate.",
    )
    parser.add_argument(
        "--csv-path",
        type=Path,
        help="Optional CSV path override. Defaults to <repo-root>/docs/product/feature-system.csv.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    repo_root = args.repo_root.resolve()
    csv_path = (
        args.csv_path.resolve()
        if args.csv_path is not None
        else repo_root / "docs" / "product" / "feature-system.csv"
    )
    prd_dir = repo_root / "docs" / "prd"

    schema_ok = True
    row_integrity_ok = True
    prd_id_uniqueness_ok = True
    prd_file_existence_ok = True
    prd_file_pattern_ok = True
    prd_id_consistency_ok = True
    prd_csv_symmetry_ok = True
    prd_prefix_uniqueness_ok = True
    date_format_ok = True
    feature_name_uniqueness_ok = True
    parse_ok = True
    total_rows = 0
    errors: list[str] = []
    warnings: list[str] = []

    try:
        with csv_path.open("r", encoding="utf-8", newline="") as handle:
            reader = csv.reader(handle, strict=True)
            rows = list(reader)
    except (csv.Error, OSError) as exc:
        parse_ok = False
        errors.append(f"Invalid CSV parsing: {exc}")
        rows = []

    if parse_ok:
        if not rows:
            schema_ok = False
            row_integrity_ok = False
            errors.append("CSV is empty.")
        else:
            header = rows[0]
            if header != EXPECTED_HEADER:
                schema_ok = False
                errors.append(
                    "Header mismatch. Expected: " + ", ".join(EXPECTED_HEADER)
                )

            seen_prd_ids: dict[str, int] = {}
            seen_feature_names: dict[str, int] = {}
            csv_prd_ids: set[str] = set()
            csv_prd_files: dict[str, tuple[int, str]] = {}
            csv_prd_numbers: list[int] = []

            for row_number, row in enumerate(rows[1:], start=2):
                total_rows += 1

                if len(row) != len(EXPECTED_HEADER):
                    row_integrity_ok = False
                    errors.append(
                        f"Row {row_number} has {len(row)} columns; expected {len(EXPECTED_HEADER)}."
                    )
                    continue

                feature_name = row[1].strip()
                status = row[3].strip()
                last_updated = row[9].strip()
                prd_id = row[10].strip()
                prd_file = row[11].strip()

                if feature_name in seen_feature_names:
                    feature_name_uniqueness_ok = False
                    errors.append(
                        f"Duplicate feature name '{feature_name}' on rows {seen_feature_names[feature_name]} and {row_number}."
                    )
                else:
                    seen_feature_names[feature_name] = row_number

                requires_prd_mapping = status == "Built"

                if prd_id:
                    if not PRD_ID_RE.match(prd_id):
                        row_integrity_ok = False
                        errors.append(
                            f"Row {row_number} has invalid prd_id '{prd_id}'. Expected PRD-[number]."
                        )
                    elif prd_id in seen_prd_ids:
                        prd_id_uniqueness_ok = False
                        errors.append(
                            f"Duplicate prd_id '{prd_id}' on rows {seen_prd_ids[prd_id]} and {row_number}."
                        )
                    else:
                        seen_prd_ids[prd_id] = row_number
                        csv_prd_ids.add(prd_id)
                        csv_prd_numbers.append(int(prd_id.split("-", 1)[1]))
                elif requires_prd_mapping:
                    row_integrity_ok = False
                    errors.append(f"Row {row_number} is Built but missing prd_id.")

                if prd_file:
                    pattern_match = PRD_FILE_RE.match(prd_file)
                    if not pattern_match:
                        prd_file_pattern_ok = False
                        errors.append(
                            f"Row {row_number} has invalid prd_file '{prd_file}'. Expected docs/prd/prd-XX-*.md."
                        )
                    else:
                        file_prd_id = f"PRD-{int(pattern_match.group(1))}"
                        if prd_id and prd_id != file_prd_id:
                            prd_id_consistency_ok = False
                            errors.append(
                                f"Row {row_number} has prd_id '{prd_id}' but prd_file '{prd_file}' maps to '{file_prd_id}'."
                            )
                        csv_prd_files[prd_file] = (row_number, file_prd_id)

                    prd_path = repo_root / prd_file
                    if not prd_path.is_file():
                        prd_file_existence_ok = False
                        errors.append(
                            f"Row {row_number} references missing prd_file '{prd_file}'."
                        )
                elif requires_prd_mapping:
                    prd_file_existence_ok = False
                    errors.append(f"Row {row_number} is Built but missing prd_file.")

                if not is_valid_date(last_updated):
                    date_format_ok = False
                    errors.append(
                        f"Row {row_number} has invalid Last Updated '{last_updated}'. Expected YYYY-MM-DD or empty."
                    )

            prd_files = sorted(prd_dir.glob("prd-*.md"))
            prd_prefixes: dict[str, Path] = {}
            repo_prd_ids: set[str] = set()

            for prd_path in prd_files:
                match = PRD_FILENAME_RE.match(prd_path.name)
                if not match:
                    continue

                prefix = f"PRD-{int(match.group(1))}"
                repo_prd_ids.add(prefix)

                if prefix in prd_prefixes:
                    prd_prefix_uniqueness_ok = False
                    errors.append(
                        f"Duplicate PRD file prefix '{prefix}' found in '{prd_prefixes[prefix].name}' and '{prd_path.name}'."
                    )
                else:
                    prd_prefixes[prefix] = prd_path

                relative_prd_path = prd_path.relative_to(repo_root).as_posix()
                if prefix not in csv_prd_ids:
                    prd_csv_symmetry_ok = False
                    errors.append(
                        f"PRD file '{relative_prd_path}' exists but has no corresponding CSV row."
                    )
                elif relative_prd_path not in csv_prd_files:
                    prd_csv_symmetry_ok = False
                    errors.append(
                        f"PRD file '{relative_prd_path}' exists but is not referenced by any CSV row."
                    )

            if csv_prd_numbers:
                sorted_numbers = sorted(set(csv_prd_numbers))
                for previous, current in zip(sorted_numbers, sorted_numbers[1:]):
                    if current - previous > 1:
                        warnings.append(
                            f"Non-sequential PRD IDs detected between PRD-{previous} and PRD-{current}."
                        )

    overall_ok = all(
        [
            parse_ok,
            schema_ok,
            row_integrity_ok,
            prd_id_uniqueness_ok,
            prd_file_existence_ok,
            prd_file_pattern_ok,
            prd_id_consistency_ok,
            prd_csv_symmetry_ok,
            prd_prefix_uniqueness_ok,
            date_format_ok,
            feature_name_uniqueness_ok,
        ]
    )

    print(f"total rows: {total_rows}")
    print(f"schema match: {'PASS' if schema_ok and parse_ok else 'FAIL'}")
    print(f"row integrity: {'PASS' if row_integrity_ok and parse_ok else 'FAIL'}")
    print(f"prd_id uniqueness: {'PASS' if prd_id_uniqueness_ok and parse_ok else 'FAIL'}")
    print(f"prd_file existence: {'PASS' if prd_file_existence_ok and parse_ok else 'FAIL'}")
    print(f"prd_file pattern: {'PASS' if prd_file_pattern_ok and parse_ok else 'FAIL'}")
    print(f"prd_id consistency: {'PASS' if prd_id_consistency_ok and parse_ok else 'FAIL'}")
    print(f"prd_csv symmetry: {'PASS' if prd_csv_symmetry_ok and parse_ok else 'FAIL'}")
    print(f"prd prefix uniqueness: {'PASS' if prd_prefix_uniqueness_ok and parse_ok else 'FAIL'}")
    print(f"feature name uniqueness: {'PASS' if feature_name_uniqueness_ok and parse_ok else 'FAIL'}")
    print(f"date format: {'PASS' if date_format_ok and parse_ok else 'FAIL'}")

    if warnings:
        print("")
        for warning in warnings:
            print(f"WARNING: {warning}")

    if not overall_ok:
        print("")
        for error in errors:
            print(f"ERROR: {error}")
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
