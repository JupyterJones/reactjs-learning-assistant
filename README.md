# reactjs-learning-assistant

A web application that helps users learn React.js concepts through interactive exercises and code examples.

## Prerequisites

* Git
* Python 3.9+
* Node.js 20+ (Recommended: Use [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm) to manage Node.js versions)
* npm

## Setup

1.  Clone the repository:

    ```bash
    git clone git@github.com:JupyterJones/reactjs-learning-assistant.git
    cd reactjs-learning-assistant
    ```

2.  Set up the backend:

    ```bash
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    which python # Verify you're using the virtual environment's Python
    python -m pip install -r requirements.txt
    ```

3.  Set up environment variables (if needed):

    * Create a `.env` file in the `backend/` directory.
    * Example `.env` (replace with your actual values):

        ```
        DATABASE_URL=sqlite:///./mydatabase.db
        API_KEY=YOUR_API_KEY
        ```

4.  Set up the frontend:

    ```bash
    cd ../frontend
    npm install
    ```

## Running the Application

You'll need two terminal windows to run the backend and frontend simultaneously.

### Terminal 1 (Backend):

1.  Navigate to the backend directory:

    ```bash
    cd backend
    ```

2.  Make the `Start` script executable (this script likely runs the Flask development server):

    ```bash
    chmod +x Start
    ```

3.  Run the backend:

    ```bash
    ./Start
    ```

    * The `Start` script starts the Flask development server on `http://localhost:8000`.

### Terminal 2 (Frontend):

1.  Navigate to the frontend directory:

    ```bash
    cd frontend
    ```

2.  Start the React development server:

    ```bash
    npm start
    ```

    * This will usually open the application in your browser at `http://localhost:3000`.
### --------------------------------------
# NOTE Information (and extra not required) 
## Python Script: `NOTE` - Command-Line Notes Tool

This Python script (`NOTE`) is a command-line tool designed for interacting with a simple notes database (stored in an SQLite file named `notes.db`). It provides functionality to manage notes directly from the terminal.

### Functionality

The script allows users to perform the following operations:

* **Create:** Initialize the notes database.
* **Insert:** Add new notes to the database.
* **Read:** Display existing notes from the database.
* **Search:** Find notes containing specific text within the database.
* **Delete:** Remove notes from the database using their unique ID.
* **Print:** Export notes to a text file.
* **Help:** Display usage instructions.

### Detailed Explanation

1.  **Imports and Setup**

    * `import sys`: Enables access to command-line arguments.
    * `import sqlite3`: Provides tools for interacting with SQLite databases.
    * `from datetime import datetime`: Imports the `datetime` class for timestamping notes.
    * `conn = sqlite3.connect("notes.db")`: Establishes a connection to the `notes.db` SQLite database file.
    * `conn.text_factory = str`: Configures SQLite to handle text data as Python strings.
    * `c = conn.cursor()`: Creates a cursor object for executing SQL queries.

2.  **Argument Handling**

    * The script validates the number of command-line arguments. If fewer than 3 are provided, it displays a help message and exits.
    * `mod = sys.argv[1]`: Stores the first command-line argument (e.g., `-I`, `-R`, `-D`) to determine the operation to be performed.

3.  **Functions**

    * `create()`:
        * Creates the `PROJECT` table in `notes.db` using the Full-Text Search (FTS4) module.
        * Returns the message "Database Created".
    * `insert(data, conn=conn, c=c)`:
        * Inserts a new note (`data`) into the `PROJECT` table, including a timestamp.
        * Prints confirmation of the insertion with the note's ID.
    * `search(data, conn=conn, c=c)`:
        * Searches for notes containing the specified text (`data`).
        * Prints the ID and content of matching notes.
    * `delete(rowid, conn=conn, c=c)`:
        * Deletes the note with the given `rowid` (row ID).
        * Returns a deletion confirmation message.
    * `main()`:
        * Retrieves all notes from the `PROJECT` table.
        * Prints each note's ID and content.
    * `prtmain(filename)`:
        * Exports all notes to a text file (`filename`), formatting each note with its ID and separating notes with "----".
    * `HELP()`:
        * Displays detailed usage instructions for the script.

4.  **Main Execution Block**

    * The script uses `if` statements to execute the appropriate function based on the value of the `mod` argument.
    * Example:
        * `if mod == "-H" or mod == "h": HELP()`
        * `if mod == "-I" or mod == "-i": insert(sys.argv[2])`
    * If an unrecognized `mod` argument is provided, a generic "Command Completed" message is printed.

### Usage Examples

(As provided by the `HELP()` output)

* `python NOTE -I "Buy groceries"`: Adds a new note.
* `python NOTE -D 3`: Deletes the note with ID 3.
* `python NOTE -R .`: Displays all notes.
* `python NOTE -S "current project"`: Searches for notes containing "current project".
* `python NOTE -T mynotes.txt`: Saves all notes to a file named `mynotes.txt`.
* `python NOTE -H .`: Shows the help message.