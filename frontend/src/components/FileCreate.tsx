// filename: reactjs-learning-assistant/frontend/src/components/FileCreate.tsx
import React, { useState } from 'react';
import axios from 'axios';

//const API_BASE_URL = 'http://localhost:8000';
const API_BASE_URL = 'http://192.168.1.100:8000';

function FileCreate() {
  const [filename, setFilename] = useState('');
  const [content, setContent] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleCreateFile = async () => {
    setMessage('');
    setError('');
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/files`,
        { filename, content },
        { headers: { 'Content-Type': 'application/json' } }
      );
      setMessage(response.data.message);
      setFilename('');
      setContent('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create file.');
    }
  };

  return (
    <div style={{ backgroundColor:'darkred', color: 'darkOrange' , marginTop: '20px', border: '1px solid #ccc', padding: '15px', borderRadius: '5px' }}>
      <h3>Create New Text File</h3>
      <div>
        <label htmlFor="filename" style={{ display: 'block', marginBottom: '5px' }}>Filename:</label>
        <input
          type="text"
          id="filename"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          style={{ width: '100%', padding: '8px', marginBottom: '10px', boxSizing: 'border-box' }}
        />
      </div>
      <div>
        <label htmlFor="content" style={{ display: 'block', marginBottom: '5px' }}>Content:</label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={15}
          style={{ width: '100%', padding: '8px',marginBottom: '10px', boxSizing: 'border-box' }}
/>
</div>
<button onClick={handleCreateFile} style={{ padding: '10px 15px' }}>Create File</button>
{message && <p style={{ color: 'green', marginTop: '10px' }}>{message}</p>}
{error && <p style={{ color: 'red', marginTop: '10px' }}>Error: {error}</p>}
</div>
);
}

export default FileCreate;