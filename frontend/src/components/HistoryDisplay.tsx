// filename: reactjs-learning-assistant/frontend/src/components/HistoryDisplay.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface HistoryItem {
  id: number;
  timestamp: string;
  question: string;
  answer: string;
}

const API_BASE_URL = 'http://192.168.1.100:8000';
const itemsPerPage = 6; // You can adjust this number

function HistoryDisplay() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get<HistoryItem[]>(`${API_BASE_URL}/api/history`);
        setHistory(response.data);
      } catch (error: any) {
        console.error("Error fetching history:", error);
        setError('Failed to load history. Is the backend running?');
        if (axios.isAxiosError(error)) {
          setError(error.response?.data?.detail || error.message || 'Failed to load history.');
        } else if (error instanceof Error) {
          setError(error.message || 'Failed to load history.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const totalPages = Math.ceil(history.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = history.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const renderHistoryItems = () => {
    return (
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {currentItems.map((item) => (
          <li key={item.id} style={{ marginBottom: '15px', borderBottom: '1px solid #ddd', paddingBottom: '15px' }}>
            <p><strong>Timestamp:</strong> {new Date(item.timestamp).toLocaleString()}</p>
            <p><strong>Question:</strong> {item.question}</p>
            <div style={{ background: 'darkred', padding: '10px', borderRadius: '3px', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
              <strong>Answer:</strong>
              <pre style={{ backgroundColor:'black', color: 'lightgreen' ,fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>{item.answer}</pre>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  const renderPagination = () => {
    if (totalPages <= 1) {
      return null;
    }

    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }

    return (
      <div style={{ marginBottom: '20px' }}> {/* Added marginBottom for spacing */}
        <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>
          Previous
        </button>
        {pageNumbers.map(number => (
          <button
            key={number}
            onClick={() => paginate(number)}
            className={currentPage === number ? 'active' : ''}
            style={{ margin: '0 5px', padding: '5px 10px', cursor: 'pointer', ...(currentPage === number && { fontWeight: 'bold' }) }}
          >
            {number}
          </button>
        ))}
        <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}>
          Next
        </button>
      </div>
    );
  };

  return (
    <div className="history-display-container" style={{ textAlign: 'left',marginTop: '20px', padding: '15px', border: '1px solid #eee',  borderRadius: '5px' }}>
      {renderPagination()} {/* Moved renderPagination here */}
      <h2>Your Learning History</h2>
      {loading && <p>Loading history...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {!loading && !error && history.length === 0 && <p>No history available yet.</p>}
      {!loading && !error && history.length > 0 && (
        <>
          {renderHistoryItems()}
        </>
      )}
    </div>
  );
}

export default HistoryDisplay;