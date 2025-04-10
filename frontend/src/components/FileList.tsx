// filename: reactjs-learning-assistant/frontend/src/components/FileList.tsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

//const API_BASE_URL = 'http://localhost:8000';
const API_BASE_URL = 'http://192.168.1.100:8000';

interface FileInfo {
  filename: string;
}

function FileList() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFileContent, setSelectedFileContent] = useState<string | null>(null);
  const [editingFilename, setEditingFilename] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [updateMessage, setUpdateMessage] = useState('');
  const [deleteMessage, setDeleteMessage] = useState('');

  const viewContentRef = useRef<HTMLDivElement>(null);
  const editAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get<FileInfo[]>(`${API_BASE_URL}/api/files`);
        setFiles(response.data);
      } catch (err: any) {
        console.error("Error fetching file list:", err);
        setError(err.response?.data?.detail || 'Failed to load file list.');
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, []); // Fetch files on component mount

  const handleViewFile = async (filename: string) => {
    try {
      const response = await axios.get<any>(`${API_BASE_URL}/api/files/${filename}`);
      setSelectedFileContent(response.data.content);
      // Scroll to the view content area after the state update triggers re-render
      setTimeout(() => {
        viewContentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 0);
    } catch (err: any) {
      console.error(`Error viewing file ${filename}:`, err);
      setSelectedFileContent(null);
    }
  };

  const handleEditFile = async (filename: string) => {
    try {
      const response = await axios.get<any>(`${API_BASE_URL}/api/files/${filename}`);
      setEditingFilename(filename);
      setEditText(response.data.content);
      setUpdateMessage('');
      // Scroll to the edit area after the state update triggers re-render
      setTimeout(() => {
        editAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 0);
    } catch (err: any) {
      console.error(`Error fetching content for editing ${filename}:`, err);
      setEditingFilename(null);
      setEditText('');
    }
  };

  const handleUpdateFile = async () => {
    if (editingFilename) {
      try {
        const response = await axios.put(
          `${API_BASE_URL}/api/files/${editingFilename}`,
          { content: editText },
          { headers: { 'Content-Type': 'application/json' } }
        );
        setUpdateMessage(response.data.message);
        setEditingFilename(null);
        // Optionally, refresh the file list
        const fetchFiles = async () => {
          setLoading(true);
          setError(null);
          try {
            const response = await axios.get<FileInfo[]>(`${API_BASE_URL}/api/files`);
            setFiles(response.data);
          } catch (err: any) {
            console.error("Error fetching file list:", err);
            setError(err.response?.data?.detail || 'Failed to load file list.');
          } finally {
            setLoading(false);
          }
        };
        fetchFiles();
      } catch (err: any) {
        console.error(`Error updating file ${editingFilename}:`, err);
        setUpdateMessage(err.response?.data?.detail || 'Failed to update file.');
      }
    }
  };

  const handleDeleteFile = async (filename: string) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/files/${filename}`);
      setDeleteMessage(response.data.message);
      // Refresh the file list
      const fetchFiles = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await axios.get<FileInfo[]>(`${API_BASE_URL}/api/files`);
          setFiles(response.data);
        } catch (err: any) {
          console.error("Error fetching file list:", err);
          setError(err.response?.data?.detail || 'Failed to load file list.');
        } finally {
          setLoading(false);
        }
      };
      fetchFiles();
    } catch (err: any) {
      console.error(`Error deleting file ${filename}:`, err);
      setDeleteMessage(err.response?.data?.detail || 'Failed to delete file.');
    }
  };

  return (
    <div style={{ backgroundColor:'darkred', color: 'black' , textAlign: 'left', marginTop: '20px', border: '1px solid #ccc', padding: '15px', borderRadius: '5px' }}>
      <h3 style={{color: 'orange'}}>List of Text Files</h3>
      {loading && <p>Loading file list...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {!loading && files.length === 0 && <p>No files created yet.</p>}
      {!loading && files.length > 0 && (
        <ul>
          {files.map((file) => (
            <li key={file.filename} style={{ marginBottom: '10px', color: 'yellow', whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontFamily: 'monospace' }}>
              {file.filename}<br/>
              <button onClick={() => handleViewFile(file.filename)} style={{ marginLeft: '10px', padding: '5px 10px' }}>View</button>
              <button onClick={() => handleEditFile(file.filename)} style={{ marginLeft: '5px', padding: '5px 10px' }}>Edit</button>
              <button onClick={() => handleDeleteFile(file.filename)} style={{ marginLeft: '5px', padding: '5px 10px', color: 'red' }}>Delete</button>
            </li>
          ))}
        </ul>
      )}

      {selectedFileContent && (
        <div
          ref={viewContentRef}
          style={{ marginTop: '20px', border: '1px solid #eee', padding: '15px', borderRadius: '3px', backgroundColor: '#f9f9f9' }}
        >
          <h4>File Content:</h4>
          <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontFamily: 'monospace' }}>{selectedFileContent}</pre>
          <button onClick={() => setSelectedFileContent(null)} style={{ marginTop: '10px', padding: '8px 12px' }}>Close</button>
        </div>
      )}

      {editingFilename && (
        <div
          ref={editAreaRef}
          style={{ marginTop: '10px', border: '1px solid #eee', padding: '15px', borderRadius: '3px', backgroundColor: '#f9f9f9' }}
        >
          <h4  style ={{whiteSpace: 'pre-wrap', wordWrap: 'break-word'}}>Edit: {editingFilename}</h4>
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={15}
            style={{ backgroundColor:'black', color: 'lightgreen' , width: '100%', padding: '8px', marginBottom: '10px', boxSizing: 'border-box', fontFamily: 'monospace' }}
          />
          <button onClick={handleUpdateFile} style={{ marginRight: '10px', padding: '8px 12px' }}>Update File</button>
          <button onClick={() => setEditingFilename(null)} style={{ padding: '8px 12px' }}>Cancel</button>
          {updateMessage && <p style={{ color: 'green', marginTop: '10px' }}>{updateMessage}</p>}
        </div>
      )}

      {deleteMessage && <p style={{ color: 'green', marginTop: '10px' }}>{deleteMessage}</p>}
    </div>
  );
}

export default FileList;