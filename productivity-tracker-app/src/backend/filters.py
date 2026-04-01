# filters.py
import re
from typing import List, Dict, Union

def detect_negated_terms(query: str) -> List[str]:
    patterns = [
        r"did not\s+([\w\s]+)",
        r"didn't\s+([\w\s]+)",
        r"no\s+([\w\s]+)",
        r"without\s+([\w\s]+)",
        r"not\s+([\w\s]+)",
    ]
    terms = []
    for p in patterns:
        terms += [m.strip() for m in re.findall(p, query.lower())]
    return terms

def filter_documents_by_negation(docs: List, neg_terms: List[str]) -> List:
    return [
        d for d in docs
        if not any(term in d.page_content.lower() for term in neg_terms)
    ]

def apply_metadata_filters(doc, filters):
    for field, condition in filters.items():
        value = doc.metadata.get(field)
        if value is None:
            return False

        for op, expected in condition.items():
            # attempt numeric comparison first
            try:
                value_num = float(value)
                expected_num = float(expected)
                if op == "gte" and not (value_num >= expected_num): return False
                if op == "lte" and not (value_num <= expected_num): return False
                if op == "gt"  and not (value_num >  expected_num): return False
                if op == "lt"  and not (value_num <  expected_num): return False
                if op == "eq"  and not (value_num == expected_num): return False
                if op == "neq" and not (value_num != expected_num): return False
            except (ValueError, TypeError):
                # fallback to case-insensitive string compare
                v = str(value).strip().lower()
                e = str(expected).strip().lower()
                if op == "eq"  and v != e: return False
                if op == "neq" and v == e: return False

    return True