import os
import shutil
import json
import re
from dotenv import load_dotenv
from langchain_community.embeddings import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

# Load environment variables
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Define vector store path
VECTOR_STORE_DIR = "vector_store"

# Remove existing vector store
if os.path.exists(VECTOR_STORE_DIR):
    print(f"Removing existing vector store at: {VECTOR_STORE_DIR}")
    shutil.rmtree(VECTOR_STORE_DIR)

# Load summaries JSON
with open("weekly_summaries.json", "r") as f:
    data = json.load(f)

# Helper functions
def extract_float(pattern, text):
    match = re.search(pattern, text, re.IGNORECASE)
    return float(match.group(1)) if match else None

def extract_int(pattern, text):
    match = re.search(pattern, text, re.IGNORECASE)
    return int(match.group(1)) if match else None

def extract_day(text):
    match = re.search(r'most productive day (?:was|is|appeared to be)?\s*(\w+)', text, re.IGNORECASE)
    return match.group(1).lower().strip() if match else None

def get_focus_tag(score):
    if score is None:
        return "Unknown"
    if score >= 8.0:
        return "High Focus"
    elif score >= 6.0:
        return "Medium Focus"
    else:
        return "Low Focus"

# Build documents with clean metadata
documents = []
for entry in data:
    summary = entry["summary"]
    week = entry["week"]

    focus_level = extract_float(r'focus level.*?(\d+(\.\d+)?)', summary)
    task_count = extract_int(r'completed (\d+) tasks', summary)
    total_hours = extract_float(r'across (\d+(\.\d+)?) hours', summary)
    most_productive_day = extract_day(summary)
    focus_tag = get_focus_tag(focus_level)

    # ✅ Ensure correct types and print for verification
    metadata = {
        "week": str(week),
        "focus_level": float(focus_level) if focus_level is not None else None,
        "task_count": int(task_count) if task_count is not None else None,
        "total_hours": float(total_hours) if total_hours is not None else None,
        "most_productive_day": most_productive_day,
        "focus_tag": focus_tag,
    }

    print(f"✅ Metadata types: {[(k, type(v)) for k,v in metadata.items()]}")
    documents.append(Document(page_content=summary, metadata=metadata))

# Split long docs
splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=50)
split_docs = splitter.split_documents(documents)

# Rebuild vector store
embedding = OpenAIEmbeddings(model="text-embedding-3-large", openai_api_key=OPENAI_API_KEY)
vectorstore = Chroma.from_documents(split_docs, embedding, persist_directory=VECTOR_STORE_DIR)

# Save
vectorstore.persist()
print(f"✅ Vector store rebuilt and saved at: {VECTOR_STORE_DIR}")