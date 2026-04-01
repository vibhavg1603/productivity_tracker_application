from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import openai
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SummaryRequest(BaseModel):
    data: str  # formatted summary string from frontend

# Initialize OpenAI client
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@app.post("/generate-summary")
async def generate_summary(req: SummaryRequest):
    try:
        messages = [
            {
                "role": "system",
                "content": (
                    "You are a sharp and insightful productivity coach. "
                    "You help users analyze their weekly task data and give practical, honest advice."
                )
            },
            {
                "role": "user",
                "content": (
                    "You are an AI productivity coach. Based on the following data for a selected week, write a structured summary with the following format:\n\n"
                    "1. **Weekly Metrics**: Include total tasks completed, total hours worked, average focus level (1–10), and the most productive day (with examples of tasks).\n"
                    "2. **Trends & Observations**: Comment briefly on focus level patterns or task types (e.g., lower focus during meetings, higher focus during coding).\n"
                    "3. **Suggestions (Bullet Points)**: Give 2–3 specific, practical tips to improve productivity next week. These should be insightful and non-generic.\n\n"
                    "Use a light,quirky tone. Avoid ending with generic motivational lines they are not needed. Focus on being helpful, concise and engaging.\n\n"
                    f"Here is the data:\n\n{req.data}"
                )
            }
        ]

        # 🔍 Print for debug
        print("🧾 Sending messages to OpenAI API:")
        for msg in messages:
            print(f"{msg['role'].upper()}:\n{msg['content']}\n")

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            temperature=0.7,
        )

        summary = response.choices[0].message.content.strip()
        return {"summary": summary}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI error: {str(e)}")