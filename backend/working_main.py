#!/home/jack/Desktop/reactjs-learning-assistant/backend/venv/bin/python
# backend/main.py
import os
import requests # Using standard requests for simplicity first
# Note: For better async performance, consider using an async client like httpx later
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel # For request body validation
from dotenv import load_dotenv
# Importing Gemini API key
import sys
sys.path.append("/home/jack/hidden/")
from Gemini_key import API_KEY
# --- Configuration ---
load_dotenv() # Load environment variables from .env file (needs python-dotenv)

GEMINI_API_KEY = API_KEY #os.getenv("GEMINI_API_KEY")
# Using gemini-1.5-flash as it's generally fast and cost-effective
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"

# --- FastAPI App Initialization ---
app = FastAPI(
    title="ReactJS Learning Assistant API",
    description="API to interact with Gemini and ChromaDB for learning ReactJS.",
    version="0.1.0"
)

# --- CORS Configuration ---
# Set up allowed origins for Cross-Origin Resource Sharing.
# Adjust the origin if your React app runs on a different port.
origins = [
    "http://localhost:3000", # Default React dev port
    "http://127.0.0.1:3000",
    # Add other origins if needed (e.g., your deployed frontend URL)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, # Allows specified origins
    allow_credentials=True, # Allows cookies (if you use them later)
    allow_methods=["*"], # Allows all methods (GET, POST, etc.)
    allow_headers=["*"], # Allows all headers
)

# --- Pydantic Models (Request/Response Schemas) ---
# Defines the expected structure for the request body of /api/ask
class AskRequest(BaseModel):
    question: str # Ensures 'question' is present and is a string

# Defines the structure for the response body of /api/ask
class AskResponse(BaseModel):
    answer: str

# --- API Endpoints ---

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
    Receives a question about ReactJS, asks Gemini, and returns the answer.
    (Does not save to ChromaDB in this version)
    """
    print(f"Received question: {request.question}") # Log received question

    if not GEMINI_API_KEY:
        print("ERROR: GEMINI_API_KEY not found in environment variables.")
        raise HTTPException(status_code=500, detail="Server configuration error: Gemini API key missing.")

    headers = {'Content-Type': 'application/json'}
    # Construct a prompt suitable for learning ReactJS
    prompt = f"In the context of ReactJS, please explain the following clearly and concisely:\n\n{request.question}"
    data = {
        "contents": [{
            "parts": [{"text": prompt}]
        }],
        # Optional: Add generationConfig if needed
        # "generationConfig": {
        #   "temperature": 0.7,
        #   "maxOutputTokens": 500,
        # }
    }

    try:
        # --- Making the API Call ---
        # Note: 'requests' is synchronous. For high concurrency, switch to 'httpx'.
        response = requests.post(GEMINI_API_URL, headers=headers, json=data, timeout=60) # Added timeout
        response.raise_for_status() # Raises HTTPError for bad responses (4XX, 5XX)

        # --- Processing the Response ---
        response_data = response.json()
        print(f"Gemini raw response: {response_data}") # Log raw response

        # Extract the text answer - Structure might vary slightly
        # Check candidates exist and have content and parts
        if (candidates := response_data.get('candidates')) and \
           (content := candidates[0].get('content')) and \
           (parts := content.get('parts')):
            extracted_text = "".join(part.get("text", "") for part in parts).strip()
        else:
            # Handle cases where the expected structure isn't present
             print("Warning: Could not extract text from Gemini response structure.")
             extracted_text = response_data.get("error", {}).get("message", "Could not parse answer from Gemini.") # Or provide a default message


        if not extracted_text:
             extracted_text = "Gemini returned an empty answer."


        print(f"Extracted answer: {extracted_text[:100]}...") # Log extracted answer start

        # --- Return the successful response ---
        return AskResponse(answer=extracted_text)

    except requests.exceptions.RequestException as e:
        print(f"Error calling Gemini API: {e}")
        raise HTTPException(status_code=503, detail=f"Failed to communicate with Gemini API: {e}")
    except Exception as e:
        # Catch unexpected errors during processing
        print(f"Unexpected error processing Gemini response: {e}")
        # Consider logging the full error trace here
        raise HTTPException(status_code=500, detail=f"Internal server error processing response: {e}")


# --- How to Run (from terminal in backend/ directory) ---
# Ensure your venv is activated
# Ensure you have a .env file with GEMINI_API_KEY=YOUR_KEY
# Run: uvicorn main:app --reload --port 8000