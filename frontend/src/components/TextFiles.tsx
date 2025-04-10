// filename: reactjs-learning-assistant/frontend/src/components/TextFile.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import FileList from './FileList'; // Import HistoryDisplay
import FileCreate from './FileCreate';
function TextFiles() {
  return (
    <div>
    <h1>NOTES</h1>
      <h2>This is the TextFile Page</h2>
      <p>Here you can create, edit and delete text files.</p>
      <FileCreate />
      <FileList /> {/* Render HistoryDisplay */}
    </div>
  );
}

export default TextFiles;