#!/home/jack/Desktop/reactjs-learning-assistant/backend/venv/bin/python
# backend/main.py
import os
import requests
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import sys
sys.path.append("/home/jack/hidden/")
from Gemini_key import API_KEY
import sqlite3
from datetime import datetime

# --- Configuration ---
load_dotenv()

GEMINI_API_KEY = API_KEY
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
DATABASE_FILE = "learning_history.db" # Name of our SQLite database file

# --- FastAPI App Initialization ---
app = FastAPI(
    title="ReactJS Learning Assistant API",
    description="API to interact with Gemini and ChromaDB for learning ReactJS.",
    version="0.1.0"
)

# --- CORS Configuration ---
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models ---
class AskRequest(BaseModel):
    question: str

class AskResponse(BaseModel):
    answer: str

class HistoryItem(BaseModel):
    id: int
    timestamp: str
    question: str
    answer: str

# --- Database Helper Functions ---
def create_connection():
    """ Create a database connection to the SQLite database specified by db_file. """
    conn = None
    try:
        conn = sqlite3.connect(DATABASE_FILE)
        return conn
    except sqlite3.Error as e:
        print(e)
    return conn

def create_history_table():
    """ Create the history table if it doesn't exist. """
    conn = create_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                question TEXT NOT NULL,
                answer TEXT NOT NULL
            )
        """)
        conn.commit()
    except sqlite3.Error as e:
        print(e)
    finally:
        if conn:
            conn.close()

def save_question_answer(question: str, answer: str):
    """ Save the question and answer to the history table. """
    conn = create_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("INSERT INTO history (question, answer) VALUES (?, ?)", (question, answer))
        conn.commit()
    except sqlite3.Error as e:
        print(e)
    finally:
        if conn:
            conn.close()

def fetch_history():
    """ Fetch all question and answer history from the database. """
    conn = create_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id, timestamp, question, answer FROM history ORDER BY timestamp DESC")
        rows = cursor.fetchall()
        return [HistoryItem(id=row[0], timestamp=row[1], question=row[2], answer=row[3]) for row in rows]
    except sqlite3.Error as e:
        print(e)
        return []
    finally:
        if conn:
            conn.close()

# --- API Endpoints ---

@app.on_event("startup")
async def startup_event():
    """ Create the history table on startup. """
    create_history_table()

@app.get("/", tags=["General"])
async def read_root():
    """ Basic welcome endpoint. """
    return {"message": "Welcome to the ReactJS Learning Assistant API!"}

@app.get("/api/test", tags=["General"])
async def test_api():
    """ Simple endpoint to test if the API is running. """
    return {"message": "Hello from Backend API!"}

@app.post("/api/ask", response_model=AskResponse, tags=["Gemini"])
async def ask_gemini(request: AskRequest):
    """
    Receives a question about ReactJS, asks Gemini, saves to the database, and returns the answer.
    """
    print(f"Received question: {request.question}")

    if not GEMINI_API_KEY:
        print("ERROR: GEMINI_API_KEY not found in environment variables.")
        raise HTTPException(status_code=500, detail="Server configuration error: Gemini API key missing.")

    headers = {'Content-Type': 'application/json'}
    prompt = f"In the context of ReactJS, please explain the following clearly and concisely:\n\n{request.question}"
    data = {
        "contents": [{
            "parts": [{"text": prompt}]
        }],
    }

    try:
        response = requests.post(GEMINI_API_URL, headers=headers, json=data, timeout=60)
        response.raise_for_status()
        response_data = response.json()
        print(f"Gemini raw response: {response_data}")

        if (candidates := response_data.get('candidates')) and \
           (content := candidates[0].get('content')) and \
           (parts := content.get('parts')):
            extracted_text = "".join(part.get("text", "") for part in parts).strip()
        else:
            print("Warning: Could not extract text from Gemini response structure.")
            extracted_text = response_data.get("error", {}).get("message", "Could not parse answer from Gemini.")

        if not extracted_text:
            extracted_text = "Gemini returned an empty answer."

        print(f"Extracted answer: {extracted_text[:100]}...")

        # Save the question and answer to the database
        save_question_answer(request.question, extracted_text)

        return AskResponse(answer=extracted_text)

    except requests.exceptions.RequestException as e:
        print(f"Error calling Gemini API: {e}")
        raise HTTPException(status_code=503, detail=f"Failed to communicate with Gemini API: {e}")
    except Exception as e:
        print(f"Unexpected error processing Gemini response: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error processing response: {e}")

# --- New API Endpoint to Fetch History ---
@app.get("/api/history", response_model=list[HistoryItem], tags=["History"])
async def get_history():
    """ Fetches and returns the history of questions and answers. """
    history_data = fetch_history()
    return history_data

# --- How to Run (from terminal in backend/ directory) ---
# Ensure your venv is activated
# Ensure you have a .env file with GEMINI_API_KEY=YOUR_KEY
# Run: uvicorn main:app --reload --port 8000