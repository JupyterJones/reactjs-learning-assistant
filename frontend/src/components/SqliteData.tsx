// filename: reactjs-learning-assistant/frontend/src/components/SqliteData.tsx
import React, { useState, useEffect, useCallback } from 'react';

interface HistoryItem {
  id: number;
  timestamp: string;
  question: string;
  answer: string;
}

function SqliteData() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');

  const [editingItem, setEditingItem] = useState<HistoryItem | null>(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');

  //const backendUrl = 'http://localhost:8000';
  const backendUrl = 'http://192.168.1.100:8000';

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${backendUrl}/api/history`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: HistoryItem[] = await response.json();
      setHistory(data);
    } catch (e) {
      console.error("Failed to fetch history:", e);
      setError(e instanceof Error ? e.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [backendUrl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddItem = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newQuestion.trim()) {
      alert('Please enter a question.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: newQuestion }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      fetchData();
      setNewQuestion('');
      setNewAnswer(''); // The answer will be fetched with history
    } catch (e) {
      console.error("Failed to add item:", e);
      setError(e instanceof Error ? e.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteItem = async (id: number) => {
    alert("Delete functionality needs to be implemented in the FastAPI backend first.");
    console.warn("Implement DELETE /api/history/{item_id} in FastAPI.");
    // (Implementation would go here, similar to the previous example)
  };

  const handleEditClick = (item: HistoryItem) => {
    setEditingItem(item);
    setEditQuestion(item.question);
    setEditAnswer(item.answer);
  };

  const handleSaveEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingItem) {
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/history/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: editQuestion, answer: editAnswer }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const updatedItem: HistoryItem = await response.json();
      // Update the history state with the edited item
      setHistory(history.map(item => (item.id === updatedItem.id ? updatedItem : item)));
      setEditingItem(null);
      setEditQuestion('');
      setEditAnswer('');
    } catch (e) {
      console.error("Failed to update item:", e);
      setError(e instanceof Error ? e.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditQuestion('');
    setEditAnswer('');
  };

  return (

    <div className="history-display-container" style={{ textAlign: 'left',marginTop: '20px', padding: '15px', border: '1px solid #eee',  borderRadius: '5px' }}>
      <h2>Using Gemini-1.5-flash</h2>

      {isLoading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {/* --- Ask Gemini Form --- */}
      <h3>Ask a Question</h3>
      <form onSubmit={handleAddItem} style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
        <div>
          <label htmlFor="newQuestion">Question: </label>
          <input
            id="newQuestion"
            type="text"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            required
            style={{ border: '2px solid red', width: '99%', height: '50px', whiteSpace: 'pre-wrap', wordWrap: 'break-word', marginBottom: '5px' }}
          />
        </div>
        <button type="submit" disabled={isLoading}>Ask Gemini</button>
      </form>
{/* --- Edit Form/Modal --- */}
      {editingItem && (
  <div style={{ marginTop: '20px', padding: '10px', border: '2px solid green', backgroundColor: 'black' }}>
    <h3>Edit Item ID: {editingItem.id}</h3>
    <form onSubmit={handleSaveEdit}>
      <div>
        <label htmlFor="editQuestion">Question: </label>
        <textarea
          id="editQuestion"
          value={editQuestion}
          onChange={(e) => setEditQuestion(e.target.value)}
          required
          style={{ width: '99%', height: '100px', whiteSpace: 'pre-wrap', wordWrap: 'break-word', marginBottom: '5px', color: 'beige',  backgroundColor: 'green' }}
        />
      </div>
      <div>
        <label htmlFor="editAnswer">Answer: </label>
        <textarea
          id="editAnswer"
          value={editAnswer}
          onChange={(e) => setEditAnswer(e.target.value)}
          required
          rows={3}
          style={{ width: '99%', height: '400px', whiteSpace: 'pre-wrap', wordWrap: 'break-word', marginBottom: '5px', backgroundColor: 'green', color: 'beige' }}
        />
      </div>
      <button type="submit" disabled={isLoading}>Save</button>
      <button type="button" onClick={handleCancelEdit} disabled={isLoading} style={{ marginLeft: '10px' }}>Cancel</button>
    </form>
  </div>
)}
      {/* --- Display History (Read) --- */}
      <h2>Using DataBase</h2>
      <h3>Question & Answer History</h3>
      {history.length === 0 && !isLoading && <p>No history found.</p>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {history.map((item) => (
          <li key={item.id} style={{ border: '1px solid #eee', marginBottom: '10px', padding: '10px', backgroundColor: 'green', color: 'black' , whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
            <p><strong>ID:</strong> {item.id}</p>
            <p><strong>Timestamp:</strong> {new Date(item.timestamp).toLocaleString()}</p>
            <p  style={{ border: '1px solid #eee', marginBottom: '10px', padding: '10px', backgroundColor: 'black', color: 'lightgreen' , whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}><strong>Question:</strong> {item.question}</p>
            <pre style={{ border: '1px solid #eee', marginBottom: '10px', padding: '10px', backgroundColor: 'black', color: 'lightgreen' , whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}><strong>Answer:</strong> {item.answer}</pre>
            <button onClick={() => handleEditClick(item)} disabled={isLoading} style={{ marginRight: '5px' }}>Edit</button>
            <button onClick={() => handleDeleteItem(item.id)} disabled={isLoading} style={{ backgroundColor: 'salmon', color: 'white' }}>Delete</button>
          </li>
        ))}
      </ul>

      
    </div>
  );
}

export default SqliteData;