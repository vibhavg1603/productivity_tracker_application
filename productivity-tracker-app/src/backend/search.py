# search.py
import numpy as np

def cosine_similarity(a: list, b: list) -> float:
    a, b = np.array(a), np.array(b)
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

def score_document(doc, q_vec, d_vec, query_text: str) -> float:
    # simple sim; you can inject your “boost” here too
    sim = cosine_similarity(q_vec, d_vec)
    # e.g. return 0.5*sim + 0.5*your_boost
    return sim

def filter_documents_by_negation(documents, negated_terms):
    return [doc for doc in documents if not any(term in doc.page_content.lower() for term in negated_terms)]

def apply_metadata_filters(doc, filters):
    """
    Returns True if doc.metadata satisfies ALL the numeric/string filters.
    Supports ops: gte, lte, gt, lt, eq, neq.
    """
    print(f"\n🔎 [filter] doc.metadata = {doc.metadata}")
    print(f"🔎 [filter] filters      = {filters}")

    for field, condition in filters.items():
        if field not in doc.metadata:
            print(f"⚠️  Missing field '{field}' → exclude")
            return False
        value = doc.metadata[field]

        for op, expected in condition.items():
            # Ensure expected is parsed as a float if possible
            try:
                if isinstance(expected, str) and expected.replace('.', '', 1).isdigit():
                    expected = float(expected)

                vf = float(value)
                ef = float(expected)

                if op == "gte" and not (vf >= ef):
                    print(f"   ✖ {field} {vf} >= {ef}? no")
                    return False
                if op == "lte" and not (vf <= ef):
                    print(f"   ✖ {field} {vf} <= {ef}? no")
                    return False
                if op == "gt"  and not (vf >  ef):
                    print(f"   ✖ {field} {vf} >  {ef}? no")
                    return False
                if op == "lt"  and not (vf <  ef):
                    print(f"   ✖ {field} {vf} <  {ef}? no")
                    return False
                if op == "eq"  and not (vf == ef):
                    print(f"   ✖ {field} {vf} == {ef}? no")
                    return False
                if op == "neq" and not (vf != ef):
                    print(f"   ✖ {field} {vf} != {ef}? no")
                    return False
                continue

            except (ValueError, TypeError):
                # Fallback to string equality
                vs = str(value).lower().strip()
                es = str(expected).lower().strip()
                if op == "eq" and vs != es:
                    print(f"   ✖ {field} '{vs}' == '{es}'? no")
                    return False
                if op == "neq" and vs == es:
                    print(f"   ✖ {field} '{vs}' != '{es}'? no")
                    return False
                continue

    print("   ✅ all filters passed\n")
    return True