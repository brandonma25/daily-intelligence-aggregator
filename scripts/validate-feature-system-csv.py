#!/usr/bin/env python3

from __future__ import annotations

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


def main() -> int:
    repo_root = Path(__file__).resolve().parent.parent
    csv_path = repo_root / "docs" / "product" / "feature-system.csv"

    schema_ok = True
    row_integrity_ok = True
    prd_id_uniqueness_ok = True
    prd_file_existence_ok = True
    date_format_ok = True
    feature_name_uniqueness_ok = True
    parse_ok = True
    total_rows = 0
    errors: list[str] = []

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
                elif requires_prd_mapping:
                    row_integrity_ok = False
                    errors.append(f"Row {row_number} is Built but missing prd_id.")

                if prd_file:
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

    overall_ok = all(
        [
            parse_ok,
            schema_ok,
            row_integrity_ok,
            prd_id_uniqueness_ok,
            prd_file_existence_ok,
            date_format_ok,
            feature_name_uniqueness_ok,
        ]
    )

    print(f"total rows: {total_rows}")
    print(f"schema match: {'PASS' if schema_ok and parse_ok else 'FAIL'}")
    print(f"row integrity: {'PASS' if row_integrity_ok and parse_ok else 'FAIL'}")
    print(f"prd_id uniqueness: {'PASS' if prd_id_uniqueness_ok and parse_ok else 'FAIL'}")
    print(f"prd_file existence: {'PASS' if prd_file_existence_ok and parse_ok else 'FAIL'}")
    print(f"feature name uniqueness: {'PASS' if feature_name_uniqueness_ok and parse_ok else 'FAIL'}")
    print(f"date format: {'PASS' if date_format_ok and parse_ok else 'FAIL'}")

    if not overall_ok:
        print("")
        for error in errors:
            print(f"ERROR: {error}")
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
