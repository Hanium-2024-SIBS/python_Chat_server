from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
from tensorflow.keras.preprocessing.sequence import pad_sequences
import pickle
import traceback
import os

app = Flask(__name__)
CORS(app, resources={r"/predict": {"origins": "http://localhost:3000"}})

current_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(current_dir, 'checkpoint', 'saved_model.keras')
tokenizer_path = os.path.join(current_dir, 'checkpoint', 'tokenizer.pickle')

# 모델과 토크나이저 로드
try:
    model = tf.keras.models.load_model(model_path)
    with open(tokenizer_path, 'rb') as handle:
        tokenizer = pickle.load(handle)
    print(model.summary())
except Exception as e:
    print(f"Error loading model or tokenizer: {e}")
    traceback.print_exc()

def preprocess_text(text):
    sequences = tokenizer.texts_to_sequences([text])
    print(f"Tokenized sequence: {sequences}")
    padded_sequences = pad_sequences(sequences, maxlen=100)
    print(f"Padded sequence: {padded_sequences}")
    return padded_sequences

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        if not data or 'message' not in data:
            return jsonify({'error': 'No text provided'}), 400

        text = data['message']
        processed_text = preprocess_text(text)
        predictions = model.predict(processed_text)
        print(f"Raw predictions: {predictions}")
        is_profanity = bool(predictions[0][0] > 0.5)  # 0.5를 임계값으로 사용

        print(f"Input text: {text}")
        print(f"Prediction value: {predictions[0][0]}")
        print(f"Is profanity: {is_profanity}")

        return jsonify({'isProfanity': is_profanity})
    except Exception as e:
        error_message = str(e)
        print(f"Error during prediction: {error_message}")
        traceback.print_exc()
        return jsonify({'error': error_message}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)