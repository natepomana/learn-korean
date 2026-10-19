"""Extract a vocab deck from a printable flashcard PDF.

Expected layout: pages come in pairs. The first page of each pair is a grid of
Korean words, the second is the matching grid of English meanings in the same
positions. A cell may wrap onto several lines (e.g. "look/see/" + "watch").

Usage:
    python scripts/extract_vocab.py pdfs/week_1_words.pdf \
        --id week-1 --title "Week 1" -o src/data/week-1.json
"""

import argparse
import json
import re
import statistics
import sys

import pdfplumber

PAGE_NUMBER = re.compile(r"^\d+$")


def page_words(page):
    words = page.extract_words(keep_blank_chars=True, x_tolerance=2)
    # Drop the page number in the bottom corner.
    return [
        w for w in words
        if not (PAGE_NUMBER.match(w["text"].strip()) and w["top"] > page.height * 0.85)
    ]


def cluster_columns(words, min_gap=60):
    """Group words into columns by their left edge."""
    columns = []
    for w in sorted(words, key=lambda w: w["x0"]):
        if columns and w["x0"] - columns[-1][-1]["x0"] < min_gap:
            columns[-1].append(w)
        else:
            columns.append([w])
    return columns


def column_blocks(column, merge_gap=None, count=None):
    """Merge consecutive lines in a column that belong to the same cell.

    Either merge lines closer than `merge_gap`, or merge the smallest gaps
    until exactly `count` cells remain.
    """
    lines = sorted(column, key=lambda w: w["top"])
    gaps = [b["top"] - a["top"] for a, b in zip(lines, lines[1:])]
    if count is not None:
        if count > len(lines):
            return None
        smallest = sorted(range(len(gaps)), key=lambda i: gaps[i])[: len(lines) - count]
        joins = set(smallest)
    else:
        joins = {i for i, gap in enumerate(gaps) if gap < merge_gap}

    blocks = [[lines[0]]] if lines else []
    for i, w in enumerate(lines[1:]):
        if i in joins:
            blocks[-1].append(w)
        else:
            blocks.append([w])
    return [" ".join(w["text"].strip() for w in block) for block in blocks]


def parse_meanings(text):
    parts = (re.sub(r"\s+", " ", p).strip() for p in text.split("/"))
    return [p for p in parts if p]


def extract_pair(front, back, page_label):
    front_cols = cluster_columns(page_words(front))
    back_cols = cluster_columns(page_words(back))
    if len(front_cols) != len(back_cols):
        sys.exit(f"{page_label}: {len(front_cols)} Korean columns but {len(back_cols)} English columns")

    # Lines closer than ~half a row apart are one wrapped cell.
    tops = sorted({round(w["top"]) for col in front_cols for w in col})
    row_gaps = [b - a for a, b in zip(tops, tops[1:]) if b - a > 20]
    merge_gap = (statistics.median(row_gaps) if row_gaps else 100) * 0.6

    cards = []
    for i, (fcol, bcol) in enumerate(zip(front_cols, back_cols)):
        korean = column_blocks(fcol, merge_gap=merge_gap)
        # The English page isn't always on the same vertical grid, so match
        # cells by order rather than position.
        english = column_blocks(bcol, count=len(korean))
        if english is None:
            sys.exit(f"{page_label} col {i + 1}: fewer English cells than Korean words {korean}")
        for ko, en in zip(korean, english):
            cards.append({"korean": ko, "english": parse_meanings(en)})
    return cards


def merge_duplicates(cards):
    merged = {}
    for card in cards:
        existing = merged.get(card["korean"])
        if existing is None:
            merged[card["korean"]] = {"korean": card["korean"], "english": list(card["english"])}
            continue
        print(f"note: {card['korean']} appears more than once; merging meanings", file=sys.stderr)
        for meaning in card["english"]:
            if meaning.lower() not in (m.lower() for m in existing["english"]):
                existing["english"].append(meaning)
    return list(merged.values())


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("pdf")
    parser.add_argument("--id", required=True, help="deck id, e.g. week-1")
    parser.add_argument("--title", required=True, help='deck title, e.g. "Week 1"')
    parser.add_argument("-o", "--output", required=True)
    args = parser.parse_args()

    with pdfplumber.open(args.pdf) as pdf:
        pages = pdf.pages
        if len(pages) % 2:
            sys.exit(f"expected an even number of pages (Korean/English pairs), got {len(pages)}")
        cards = []
        for i in range(0, len(pages), 2):
            cards += extract_pair(pages[i], pages[i + 1], f"pages {i + 1}-{i + 2}")

    deck = {"id": args.id, "title": args.title, "cards": merge_duplicates(cards)}
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(deck, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"wrote {len(deck['cards'])} cards to {args.output}", file=sys.stderr)


if __name__ == "__main__":
    main()
