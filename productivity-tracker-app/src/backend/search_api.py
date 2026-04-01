from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from typing import Optional, Dict, List, Union
from filters import detect_negated_terms
from search import cosine_similarity, filter_documents_by_negation, apply_metadata_filters, score_document
import os
import json
from openai import OpenAI
import re

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

client = OpenAI(api_key=OPENAI_API_KEY)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SearchRequest(BaseModel):
    query: Optional[str] = Field(None, description="Search query string")
    metadata_filters: Optional[Dict[str, Dict[str, Union[str, float]]]] = Field(None, description="Flexible metadata filters")
    limit: Optional[int] = Field(10)

# Optional: Use OpenAI LLM to extract filters from natural language
import traceback

async def extract_filters_with_llm(query: str) -> Dict[str, Dict[str, Union[str, float]]]:
    prompt = f"""
Extract structured filters from the following user query:

Query: "{query}"

Only use **these allowed field names** in your response:
- "task_count"
- "focus_level"
- "most_productive_day"
- "total_hours"
- "focus_tag"
- "week"

Return the filters as a JSON object in this format:
{{
    "focus_level": {{ "gte": 7 }},
    "most_productive_day": {{ "eq": "Friday" }}
}}

DO NOT make up or guess field names or values. Follow this very strictly.
For "focus_tag" ONLY acceptable values are: "High Focus", "Medium Focus", "Low Focus". 
For "focus_level" ONLY use valid numeric comparisons with keys like "gte", "lte", "eq".
"""

    print("🔍 Sending LLM prompt:\n", prompt)

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
        )
        content = response.choices[0].message.content
        print("📥 LLM raw response:\n", content)

        match = re.search(r"{.*}", content, re.DOTALL)
        filters_json = match.group(0) if match else "{}"
        parsed = json.loads(filters_json)

        ALLOWED_FIELDS = {"task_count", "focus_level", "most_productive_day", "total_hours", "focus_tag", "week"}
        ALLOWED_FOCUS_TAGS = {"High Focus", "Medium Focus", "Low Focus"}
        NUMERIC_FIELDS = {"focus_level", "task_count", "total_hours"}

        normalized = {}

        for key, ops in parsed.items():
            if key not in ALLOWED_FIELDS:
                continue

            # Numeric field: cast values to float
            if key in NUMERIC_FIELDS:
                clean_ops = {}
                for op, val in ops.items():
                    try:
                        clean_ops[op] = float(val)
                    except:
                        continue
                if clean_ops:
                    normalized[key] = clean_ops

            # focus_tag: enforce only known values
            elif key == "focus_tag":
                for op, val in ops.items():
                    if val in ALLOWED_FOCUS_TAGS:
                        normalized[key] = {op: val}

            # most_productive_day: keep as-is, but capitalize
            elif key == "most_productive_day":
                for op, val in ops.items():
                    normalized[key] = {op: val.capitalize()}

            # For 'week' and others (no enforcement, trust LLM within allowed keys)
            else:
                normalized[key] = ops

        parsed = normalized
        print("✅ Parsed filters:\n", parsed)

        field_aliases = {
            "completed_tasks": "task_count",
            "tasks_completed": "task_count",
            "tasks": "task_count",
            "focus": "focus_level",
            "focus_score": "focus_level",
            "most_focused_day": "most_productive_day",
        }

        normalized = {}
        for key, value in parsed.items():
            new_key = field_aliases.get(key.lower(), key)
            normalized[new_key] = value

        parsed = normalized

        print("✅ Parsed filters:\n", parsed)
        return parsed

    except Exception as e:
        print("❌ Failed to extract filters from LLM")
        traceback.print_exc()
        return {}

@app.post("/search")
async def search_similar_weeks(filters: SearchRequest):
    try:
        embeddings = OpenAIEmbeddings(model="text-embedding-3-large", openai_api_key=OPENAI_API_KEY)
        db = Chroma(persist_directory="vector_store", embedding_function=embeddings)
        query_text = filters.query or ""
        query_vector = embeddings.embed_query(query_text)

        documents = db.similarity_search_by_vector(query_vector, k=100)

        negated_terms = detect_negated_terms(query_text)
        documents = filter_documents_by_negation(documents, negated_terms)

        if not filters.metadata_filters:
            llm_filters = await extract_filters_with_llm(query_text)
            filters.metadata_filters = llm_filters

        NUMERIC_FIELDS = {"focus_level", "task_count", "total_hours"}
        if filters.metadata_filters:
            for field, ops in filters.metadata_filters.items():
                if field in NUMERIC_FIELDS:
                    for op in ops:
                        try:
                            ops[op] = float(ops[op])
                        except (ValueError, TypeError):
                            pass
                else:
                    for op in ops:
                        if isinstance(ops[op], str):
                            ops[op] = ops[op].strip().lower()

        trace_log = []
        results = []
        for doc in documents:
            print("Raw metadata →", doc.metadata)
            print("📎 Filters used:", filters.metadata_filters)

            if filters.metadata_filters and not apply_metadata_filters(doc, filters.metadata_filters):
                print(f"❌ FILTERED OUT: {doc.metadata.get('week')} - {doc.metadata.get('most_productive_day')}")
                continue

            doc_vector = embeddings.embed_query(doc.page_content)
            score = score_document(doc, query_vector, doc_vector, query_text)

            trace_log.append({"week": doc.metadata.get("week"), "score": score, "filtered_out": False})

            results.append({
                "week": doc.metadata.get("week", "Unknown Week"),
                "summary": doc.page_content,
                "focus_level": doc.metadata.get("focus_level"),
                "tasks": doc.metadata.get("task_count"),
                "most_productive_day": doc.metadata.get("most_productive_day"),
                "similarity": round(score * 100, 2)
            })

        results.sort(key=lambda x: x["similarity"], reverse=True)
        return {
            "results": results[:filters.limit or 10],
            "filters_used": filters.metadata_filters,
            "trace_log": trace_log[:filters.limit or 10],
            "note": f"Showing top {min(len(results), filters.limit or 10)} of {len(results)} relevant weeks"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))