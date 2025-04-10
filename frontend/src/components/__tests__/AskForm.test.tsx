import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AskForm from '../AskForm';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AskForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear previous mocks
  });

  test('renders textarea and button', () => {
    render(<AskForm />);
    expect(screen.getByPlaceholderText(/what is usestate\?/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ask question/i })).toBeInTheDocument();
  });

  test('displays an error when submitting empty question', async () => {
    render(<AskForm />);
    fireEvent.click(screen.getByRole('button', { name: /ask question/i }));
    expect(await screen.findByText(/please enter a question/i)).toBeInTheDocument();
  });

  test('sends question and displays answer', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { answer: 'useState is a Hook that lets you add state to function components.' },
    });

    render(<AskForm />);
    const textarea = screen.getByPlaceholderText(/what is usestate\?/i);
    const button = screen.getByRole('button', { name: /ask question/i });

    // Type question and submit
    await userEvent.type(textarea, 'What is useState?');
    fireEvent.click(button);

    // Wait for the answer
    await waitFor(() => {
      expect(screen.getByText(/Answer:/i)).toBeInTheDocument();
      expect(screen.getByText(/useState is a Hook/i)).toBeInTheDocument();
    });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:8000/api/ask',
      { question: 'What is useState?' },
      { headers: { 'Content-Type': 'application/json' } }
    );
  });

  test('displays error if backend fails', async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: { data: { detail: 'Backend error occurred.' } },
    });

    render(<AskForm />);
    const textarea = screen.getByPlaceholderText(/what is usestate\?/i);
    const button = screen.getByRole('button', { name: /ask question/i });

    await userEvent.type(textarea, 'What is JSX?');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/backend error occurred/i)).toBeInTheDocument();
    });
  });

  test('displays fallback error for unexpected response', async () => {
    mockedAxios.post.mockResolvedValueOnce({}); // No answer

    render(<AskForm />);
    const textarea = screen.getByPlaceholderText(/what is usestate\?/i);
    const button = screen.getByRole('button', { name: /ask question/i });

    await userEvent.type(textarea, 'What is a hook?');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/unexpected response format/i)).toBeInTheDocument();
    });
  });
});
