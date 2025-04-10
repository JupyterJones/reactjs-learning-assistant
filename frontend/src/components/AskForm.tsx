// filename: reactjs-learning-assistant/frontend/src/components/AskForm.tsx
import React, { useState } from 'react';
import axios, { AxiosError } from 'axios'; // Import AxiosError

// Define the base URL for your backend API
//const API_BASE_URL = 'http://localhost:8000'; // Or your backend port if different
const API_BASE_URL = 'http://192.168.1.100:8000';
function AskForm() {
  // State variables
  const [question, setQuestion] = useState(''); // Holds the text from the textarea
  const [answer, setAnswer] = useState(''); // Holds the answer from the backend
  const [isLoading, setIsLoading] = useState(false); // Tracks if waiting for API response
  const [error, setError] = useState<string | null>(null); // Holds any error messages (can be string or null)

  // Function to handle changes in the textarea
  const handleQuestionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuestion(event.target.value);
  };

  // Function to handle form submission (when the button is clicked)
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); // Prevent default form submission if using <form>

    // Don't submit if the question is empty or only whitespace
    if (!question.trim()) {
      setError('Please enter a question.');
      return;
    }

    setIsLoading(true); // Set loading state
    setAnswer('');      // Clear previous answer
    setError(null);       // Clear previous error

    try {
      // Make the POST request to the backend API
      const response = await axios.post(
        `${API_BASE_URL}/api/ask`,
        {
          question: question, // Send the question in the request body
        },
        {
          headers: {
            'Content-Type': 'application/json', // Explicitly set the Content-Type header
          },
        }
      );

      // Update state with the received answer
      if (response.data && response.data.answer) {
        setAnswer(response.data.answer);
      } else {
        // Handle cases where the response might not have the expected format
        setError('Received an unexpected response format from the server.');
      }

    } catch (err: unknown) {
      // Handle errors during the API call
      console.error("Error calling backend API:", err);
      let errorMessage = 'Failed to get answer. Is the backend running?';
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.detail || err.message || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message || errorMessage;
      }
      setError(errorMessage);

    } finally {
      // Always set loading state back to false, regardless of success or error
      setIsLoading(false);
    }
  };

  // --- JSX for Rendering ---
  return (
    <div style={{ width: '95%', textAlign: 'left', marginTop: '20px', marginRight:'auto', marginLeft: 'auto', padding: '5px', border: '1px solid #eee',  borderRadius: '5px', backgroundColor: 'darkred',color: 'yellow' }}> 
    <div className="ask-form-container" style={{ width: '90%', textAlign: 'left',marginTop: '20px', padding: '15px', borderRadius: '5px', backgroundColor: 'darkred' }}> {/* Optional: Add CSS class for styling */}
      <h2>Ask about ReactJS</h2>
      <form onSubmit={handleSubmit}>
        <textarea
          value={question}
          onChange={handleQuestionChange}
          placeholder="e.g., What is useState?"
          //rows={5} // Adjust size as needed
          //cols={30}
          disabled={isLoading} // Disable textarea while loading
          required // Make input required
          style={{ width: '95%', marginBottom: '10px', marginRight: '10px', padding: '8px' }} // Basic styling
        />
        <br />
        <button
          type="submit"
          disabled={isLoading || !question.trim()} // Disable button if loading or no question
          style={{ padding: '10px 15px' }} // Basic styling
        >
          {isLoading ? 'Asking Gemini...' : 'Ask Question'}
        </button>
      </form>
      </div>
      {/* Display Loading Message */}
      {isLoading && <p style={{ marginTop: '15px' }}>Loading answer...</p>}

      {/* Display Error Message */}
      {error && <p style={{ color: 'red', marginTop: '15px' }}>Error: {error}</p>}

      {/* Display Answer */}
      {answer && (
        <div className="answer-section" style={{ textAlign: 'left', marginTop: '20px', borderTop: '1px solid #ccc', paddingTop: '15px', backgroundColor:'darkred', color: 'darkorange' }}>
          <h3>Answer:</h3>
          {/* Using <pre> preserves whitespace and line breaks from the answer */}
          <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', background: 'black', color: 'lightgreen', padding: '10px', borderRadius: '4px' }}>
            {answer}
          </pre>
        </div>
      )}
    </div>
  );
}

export default AskForm;