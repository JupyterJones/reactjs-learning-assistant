#!app.py
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/api/ask', methods=['POST','GET'])
def ask_question():
    data = request.get_json()
    question = data.get('question')
    if question:
        # Process the question and generate an answer
        answer = f"You asked: {question}. The answer is..."
        return jsonify({'answer': answer})
    else:
        return jsonify({'error': 'Missing question'}), 400

if __name__ == '__main__':
    app.run(debug=True, port=8000)