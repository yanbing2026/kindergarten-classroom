#!/usr/bin/env python3
"""
Kindergarten Classroom — Content Validation Tool
Validates educational data in index.html for:
- Duplicate IDs
- Missing/broken image references
- Invalid translations / missing language fields
- Invalid level assignments
- Malformed data
"""

import re
import os
from pathlib import Path
from collections import defaultdict

PROJECT_ROOT = Path(__file__).resolve().parent.parent
INDEX_FILE = PROJECT_ROOT / "index.html"
IMAGES_DIR = PROJECT_ROOT / "images"

IMAGE_EXTS = {'.png', '.webp', '.jpg', '.jpeg', '.gif', '.svg'}


def load_text():
    if not INDEX_FILE.exists():
        raise SystemExit(f"ERROR: {INDEX_FILE} not found")
    return INDEX_FILE.read_text()


def get_all_images_on_disk():
    images = set()
    for f in IMAGES_DIR.rglob("*"):
        if f.is_file() and f.suffix.lower() in IMAGE_EXTS:
            images.add(str(f.relative_to(PROJECT_ROOT)))
    return images


def extract_string_literals(text):
    """Extract all single-quoted string literals from the JS block."""
    return re.findall(r"'([^'\\]*(?:\\.[^'\\]*)*)'", text)


def extract_id_img_pairs(text):
    """
    Extract (id, img) pairs from object literals in the JS.
    Pattern: {id:'...', ..., img:'...', ...}
    """
    pairs = []
    # Match objects that contain id: and img:
    for m in re.finditer(r"\{[^{}]*?id\s*:\s*'([^']+)'[^{}]*?img\s*:\s*'([^']+)'[^{}]*\}", text):
        pairs.append((m.group(1), m.group(2)))
    # Also match multiline objects with id/img on separate lines
    for m in re.finditer(r"\{[^{}]*?id\s*:\s*'([^']+)'[\s\S]*?img\s*:\s*'([^']+)'[\s\S]*?\}", text):
        pairs.append((m.group(1), m.group(2)))
    return pairs


def extract_objects_with_field(text, field):
    """Extract all object blocks that contain a given field."""
    results = []
    # Simple heuristic: find id:'...' and field:'...' within ~500 chars
    for m in re.finditer(r"id\s*:\s*'([^']+)'", text):
        start = m.start()
        snippet = text[start:start + 800]
        fm = re.search(rf"{re.escape(field)}\s*:\s*'([^']+)'", snippet)
        if fm:
            results.append((m.group(1), fm.group(1)))
    return results


def validate_vocab(text, images_on_disk):
    errors = []
    # Find VOCAB_LEVELS = [ ... ];
    m = re.search(r"const\s+VOCAB_LEVELS\s*=\s*\[", text)
    if not m:
        errors.append("FATAL: VOCAB_LEVELS not found")
        return errors

    # Extract all id:'...' between the brackets
    start = m.end() - 1
    # Find matching closing bracket
    depth = 1
    pos = start + 1
    while depth > 0 and pos < len(text):
        ch = text[pos]
        if ch == '[':
            depth += 1
        elif ch == ']':
            depth -= 1
        pos += 1
    vocab_block = text[start:pos]

    # Extract entries: each entry is {id:'...', emoji:'...', img:'...', en:'...', zh:{hanzi:'...'}, es:'...'}
    # We look for id: occurrences and then inspect surrounding text.
    seen_ids = set()
    seen_global = set()
    # Find all id:'...' within vocab_block
    for id_m in re.finditer(r"id\s*:\s*'([^']+)'", vocab_block):
        item_id = id_m.group(1)
        snippet = vocab_block[id_m.start():id_m.start() + 400]
        # Check required fields
        if "emoji:" not in snippet and "emoji':" not in snippet:
            errors.append(f"VOCAB {item_id}: missing emoji")
        if "img:" not in snippet and "img':" not in snippet:
            errors.append(f"VOCAB {item_id}: missing img")
        if "en:" not in snippet and "en':" not in snippet:
            errors.append(f"VOCAB {item_id}: missing en")
        if "hanzi:" not in snippet:
            errors.append(f"VOCAB {item_id}: missing zh.hanzi")
        if "es:" not in snippet and "es':" not in snippet:
            errors.append(f"VOCAB {item_id}: missing es")
        # Check image exists
        img_m = re.search(r"img\s*:\s*'([^']+)'", snippet)
        if img_m:
            img = img_m.group(1)
            if img not in images_on_disk:
                errors.append(f"MISSING IMAGE: {item_id}: {img}")
        if item_id in seen_global:
            errors.append(f"DUPLICATE ID: '{item_id}'")
        seen_global.add(item_id)
    return errors


def validate_science(text, images_on_disk):
    errors = []
    m = re.search(r"const\s+SCIENCE_LEVELS\s*=\s*\[", text)
    if not m:
        errors.append("SCIENCE_LEVELS not found")
        return errors
    start = m.end() - 1
    depth = 1
    pos = start + 1
    while depth > 0 and pos < len(text):
        ch = text[pos]
        if ch == '[':
            depth += 1
        elif ch == ']':
            depth -= 1
        pos += 1
    block = text[start:pos]
    seen = set()
    for id_m in re.finditer(r"id\s*:\s*'([^']+)'", block):
        item_id = id_m.group(1)
        snippet = block[id_m.start():id_m.start() + 300]
        if "emoji:" not in snippet and "emoji':" not in snippet:
            errors.append(f"SCIENCE {item_id}: missing emoji")
        if "fact:" not in snippet and "fact':" not in snippet:
            errors.append(f"SCIENCE {item_id}: missing fact")
        # Science images are built dynamically as './images/science/' + v.id + '.webp'
        # so we only flag if a static img field is present and broken.
        img_m = re.search(r"img\s*:\s*'([^']+)'", snippet)
        if img_m:
            img = img_m.group(1)
            if img not in images_on_disk:
                errors.append(f"MISSING SCIENCE IMAGE: {item_id}: {img}")
        if item_id in seen:
            errors.append(f"DUPLICATE SCIENCE ID: '{item_id}'")
        seen.add(item_id)
    return errors


def validate_other_categories(text):
    errors = []
    category_checks = [
        ('PATTERNS_LEVELS', ['id', 'sequence', 'answer', 'options']),
        ('COMPARING_LEVELS', ['id', 'num1', 'num2', 'answer']),
        ('POSITIONS_LEVELS', ['id', 'answer', 'scene']),
        ('MEASUREMENT_LEVELS', ['id', 'answer', 'question']),
        ('TIME_LEVELS', ['id', 'answer']),
        ('MONEY_LEVELS', ['id', 'total', 'coins']),
        ('ONEMORELESS_LEVELS', ['id', 'answer']),
        ('RHYMING_LEVELS', ['id', 'correct', 'distractors']),
        ('SIGHTWORDS_LEVELS', ['id']),
        ('MAKE10_LEVELS', ['id', 'answer', 'options']),
        ('DECOMPOSE_LEVELS', ['id', 'answer', 'options']),
        ('TEEN_NUMBERS_LEVELS', ['id', 'number']),
        ('SORT_CLASSIFY_LEVELS', ['id', 'answer', 'question']),
        ('SHAPES3D_LEVELS', ['id', 'name']),
        ('PRINT_CONCEPTS_LEVELS', ['id', 'answer', 'options']),
        ('BEGIN_END_SOUNDS_LEVELS', ['id', 'answer', 'options']),
        ('SENTENCES_LEVELS', ['id', 'correct', 'options']),
        ('PREPOSITIONS_LEVELS', ['id', 'answer', 'options']),
        ('SORT_CATEGORY_LEVELS', ['id', 'correctCategory', 'categories']),
    ]
    for const_name, required in category_checks:
        m = re.search(rf"const\s+{re.escape(const_name)}\s*=\s*\[", text)
        if not m:
            errors.append(f"{const_name}: not found")
            continue
        start = m.end() - 1
        depth = 1
        pos = start + 1
        while depth > 0 and pos < len(text):
            ch = text[pos]
            if ch == '[':
                depth += 1
            elif ch == ']':
                depth -= 1
            pos += 1
        block = text[start:pos]
        # Find each level array within the block using bracket depth
        search_pos = 0
        lvl_idx = 0
        while True:
            lv_m = re.search(r"\[\s*\{", block[search_pos:])
            if not lv_m:
                break
            lv_start = search_pos + lv_m.start()
            # Find the matching ] for this level
            inner_depth = 0
            i = lv_start
            while i < len(block):
                ch = block[i]
                if ch == '[':
                    inner_depth += 1
                elif ch == ']':
                    inner_depth -= 1
                    if inner_depth == 0:
                        break
                i += 1
            lv_text = block[lv_start:i + 1]
            # Extract all items in this level using bracket-depth
            item_search = 0
            while True:
                item_m = re.search(r"\{\s*id\s*:\s*'([^']+)'", lv_text[item_search:])
                if not item_m:
                    break
                item_start = item_search + item_m.start()
                # Find matching } for this item
                item_depth = 0
                j = item_start
                while j < len(lv_text):
                    ch = lv_text[j]
                    if ch == '{':
                        item_depth += 1
                    elif ch == '}':
                        item_depth -= 1
                        if item_depth == 0:
                            break
                    j += 1
                item_snippet = lv_text[item_start:j + 1]
                item_id = item_m.group(1)
                missing = [f for f in required if f not in item_snippet]
                if missing:
                    errors.append(f"{const_name} L{lvl_idx} {item_id}: missing {', '.join(missing)}")
                item_search = j + 1
            search_pos = i + 1
            lvl_idx += 1
    return errors


def validate_math_levels(text):
    # MATH_LEVELS is constructed with Array.from, not a literal array.
    if "const MATH_LEVELS = Array.from" not in text:
        return ["MATH_LEVELS: unexpected definition"]
    if "id: 'L' + (i+1)" not in text:
        return ["MATH_LEVELS: missing expected id pattern"]
    return []


def main():
    print("=" * 60)
    print("Kindergarten Classroom — Content Validation")
    print("=" * 60)

    text = load_text()
    images_on_disk = get_all_images_on_disk()
    print(f"Loaded index.html ({len(text)} chars)")
    print(f"Found {len(images_on_disk)} images on disk")

    all_errors = []

    print("\n--- VOCAB_LEVELS ---")
    errors = validate_vocab(text, images_on_disk)
    all_errors.extend(errors)
    if errors:
        for e in errors[:20]:
            print(f"  ✗ {e}")
        if len(errors) > 20:
            print(f"  ... and {len(errors) - 20} more")
    else:
        print("  ✓ OK")

    print("\n--- SCIENCE_LEVELS ---")
    errors = validate_science(text, images_on_disk)
    all_errors.extend(errors)
    if errors:
        for e in errors[:20]:
            print(f"  ✗ {e}")
        if len(errors) > 20:
            print(f"  ... and {len(errors) - 20} more")
    else:
        print("  ✓ OK")

    print("\n--- Other Categories ---")
    errors = validate_other_categories(text)
    all_errors.extend(errors)
    if errors:
        for e in errors[:20]:
            print(f"  ✗ {e}")
        if len(errors) > 20:
            print(f"  ... and {len(errors) - 20} more")
    else:
        print("  ✓ OK")

    print("\n--- MATH_LEVELS ---")
    errors = validate_math_levels(text)
    all_errors.extend(errors)
    if errors:
        for e in errors:
            print(f"  ✗ {e}")
    else:
        print("  ✓ OK")

    # Check for common data issues
    print("\n--- Common Issues ---")
    issues = []
    # Duplicate IDs across entire file
    all_ids = re.findall(r"id\s*:\s*'([^']+)'", text)
    id_counts = {}
    for i in all_ids:
        id_counts[i] = id_counts.get(i, 0) + 1
    dups = {k: v for k, v in id_counts.items() if v > 1}
    if dups:
        for k, v in list(dups.items())[:10]:
            issues.append(f"ID '{k}' appears {v} times")
    if issues:
        for e in issues:
            print(f"  ⚠ {e}")
    else:
        print("  ✓ No duplicate IDs")

    print("\n" + "=" * 60)
    if all_errors:
        print(f"FAILED: {len(all_errors)} issue(s) found")
        return 1
    else:
        print("PASSED: No content issues detected")
        return 0


if __name__ == "__main__":
    exit(main())
