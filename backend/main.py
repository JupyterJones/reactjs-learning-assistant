#!/home/jack/Desktop/reactjs-learning-assistant/backend/venv/bin/python
# backend/main.py
import os
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import sys
from Gemini_key import API_KEY
import requests
# --- Configuration ---
load_dotenv()

GEMINI_API_KEY = API_KEY
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
DATABASE_FILE = "learning_history.db"
FILES_DIR = "files"  # Directory to store text files
os.makedirs(FILES_DIR, exist_ok=True) # Ensure the directory exists

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
    "http://192.168.1.100:3000",
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

class FileCreateRequest(BaseModel):
    filename: str
    content: str

class FileUpdateRequest(BaseModel):
    content: str

class FileResponse(BaseModel):
    filename: str
    content: str

class MessageResponse(BaseModel):
    message: str

class FileInfo(BaseModel):
    filename: str


class HistoryItemUpdate(BaseModel):
    question: str
    answer: str

class VideoIdResponse(BaseModel):
    video_id: str

# --- Database Helper Functions (Keep these as they are) ---
import sqlite3
from datetime import datetime

def create_connection():
    conn = None
    try:
        conn = sqlite3.connect(DATABASE_FILE)
        return conn
    except sqlite3.Error as e:
        print(e)
    return conn

def create_history_table():
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
    create_history_table()

@app.get("/", tags=["General"])
async def read_root():
    return {"message": "Welcome to the ReactJS Learning Assistant API!"}

@app.get("/api/test", tags=["General"])
async def test_api():
    return {"message": "Hello from Backend API!"}

@app.post("/api/ask", response_model=AskResponse, tags=["Gemini"])
async def ask_gemini(request: AskRequest):
    print(f"Received question: {request.question}")
    if not GEMINI_API_KEY:
        print("ERROR: GEMINI_API_KEY not found in environment variables.")
        raise HTTPException(status_code=500, detail="Server configuration error: Gemini API key missing.")
    headers = {'Content-Type': 'application/json'}
    prompt = f"In the context of ReactJS and FastAPI, please explain the following clearly and concisely. Give examples when appropriate:\n\n{request.question}"
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
        save_question_answer(request.question, extracted_text)  # Save to database

        # --- Save question as filename and answer as content ---
        filename = request.question.replace(" ", "_") + ".txt"
        filepath = os.path.join(FILES_DIR, filename)
        try:
            with open(filepath, "w") as f:
                f.write(extracted_text)
            print(f"Saved question and answer to file: {filename}")
        except Exception as e:
            print(f"Error saving to file: {e}")
            # You might want to handle this error more gracefully,
            # perhaps by logging it or returning a specific error message to the frontend.

        return AskResponse(answer=extracted_text)
    except requests.exceptions.RequestException as e:
        print(f"Error calling Gemini API: {e}")
        raise HTTPException(status_code=503, detail=f"Failed to communicate with Gemini API: {e}")
    except Exception as e:
        print(f"Unexpected error processing Gemini response: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error processing response: {e}")

@app.get("/api/history", response_model=list[HistoryItem], tags=["History"])
async def get_history():
    history_data = fetch_history()
    return history_data

# --- Text File CRUD Endpoints ---
@app.post("/api/files", response_model=MessageResponse, tags=["Files"])
async def create_file(file_data: FileCreateRequest):
    """ Creates a new text file. """
    filename = file_data.filename  # Get filename from request
    filepath = os.path.join(FILES_DIR, filename[:50])
    try:
        with open(filepath, "w") as f:
            f.write(file_data.content)
        return {"message": f"File '{filename}' created successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating file: {e}")

@app.get("/api/files/{filename}", response_model=FileResponse, tags=["Files"])
async def read_file(filename: str):
    """ Reads the content of a text file. """
    filepath = os.path.join(FILES_DIR, filename)
    try:
        with open(filepath, "r") as f:
            content = f.read()
        return {"filename": filename, "content": content}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"File '{filename}' not found.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading file: {e}")

@app.put("/api/files/{filename}", response_model=MessageResponse, tags=["Files"])
async def update_file(filename: str, file_data: FileUpdateRequest):
    """ Updates the content of an existing text file. """
    filepath = os.path.join(FILES_DIR, filename)
    try:
        with open(filepath, "w") as f:
            f.write(file_data.content)
        return {"message": f"File '{filename}' updated successfully."}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"File '{filename}' not found.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating file: {e}")

@app.delete("/api/files/{filename}", response_model=MessageResponse, tags=["Files"])
async def delete_file(filename: str):
    """ Deletes a text file. """
    filepath = os.path.join(FILES_DIR, filename)
    try:
        os.remove(filepath)
        return {"message": f"File '{filename}' deleted successfully."}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"File '{filename}' not found.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting file: {e}")
        
def get_files_sorted_by_date():
    files = []
    for filename in os.listdir(FILES_DIR):
        filepath = os.path.join(FILES_DIR, filename)
        if os.path.isfile(filepath):
            try:
                # Get modification time and sort by it.  Error handling is crucial.
                timestamp = os.path.getmtime(filepath)
                files.append({"name": filename, "lastModified": timestamp})
            except OSError as e:
                print(f"Error accessing file {filepath}: {e}")
    files.sort(key=lambda x: x['lastModified'], reverse=True)
    return files

@app.get("/api/files", response_model=list[FileInfo], tags=["Files"])
async def list_files():
    """ Lists all text files in the designated directory. """
    try:
        filenames = [f for f in os.listdir(FILES_DIR) if os.path.isfile(os.path.join(FILES_DIR, f))]
        return [FileInfo(filename=name) for name in filenames]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing files: {e}")


# --- API Endpoints ---

# ... (your existing /api/test, /api/ask, /api/history (GET)) ...

@app.get("/api/history/{item_id}", response_model=HistoryItem, tags=["History"])
async def get_history_item(item_id: int):
    conn = create_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id, timestamp, question, answer FROM history WHERE id = ?", (item_id,))
        row = cursor.fetchone()
        if row:
            return HistoryItem(id=row[0], timestamp=row[1], question=row[2], answer=row[3])
        else:
            raise HTTPException(status_code=404, detail=f"History item with ID {item_id} not found")
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    finally:
        if conn:
            conn.close()

@app.put("/api/history/{item_id}", response_model=HistoryItem, tags=["History"])
async def update_history_item(item_id: int, item_update: HistoryItemUpdate):
    conn = create_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE history SET question=?, answer=? WHERE id=?",
            (item_update.question, item_update.answer, item_id),
        )
        conn.commit()
        if cursor.rowcount > 0:
            # Fetch the updated item to return
            cursor.execute("SELECT id, timestamp, question, answer FROM history WHERE id = ?", (item_id,))
            row = cursor.fetchone()
            return HistoryItem(id=row[0], timestamp=row[1], question=row[2], answer=row[3])
        else:
            raise HTTPException(status_code=404, detail=f"History item with ID {item_id} not found")
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    finally:
        if conn:
            conn.close()
'''
@app.get("/video_id")
async def get_video_id():
    video_id = "bt_i7sQgqEs"
    return JSONResponse(content={"video_id": video_id})  # Use JSONResponse
'''
@app.get("/video_id")
async def get_video_id():
    return {"video_id": "bt_i7sQgqEs"}
