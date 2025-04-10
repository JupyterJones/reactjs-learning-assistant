// filename: reactjs-learning-assistant/frontend/src/components/SecondPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import HistoryDisplay from './HistoryDisplay'; // Import HistoryDisplay

function SecondPage() {
  return (
    <div>
      <h2>This is the Second Page</h2>
      <Link style ={{color:'lightgray',fontSize: '26px'}} to="/">Return Home</Link>
      <p>From Home Question Gemini-1.5-flash.</p>
      <HistoryDisplay /> {/* Render HistoryDisplay */}
      
    </div>
  );
}

export default SecondPage;