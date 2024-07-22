from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.python.keras.models import load_model
import numpy as np

app = Flask(__name__)
CORS(app)  # CORS 설정 추가

# 모델 로드
try:
    model = load_model('./checkpoint/saved_model')  # 모델 파일 경로 확인
    print("모델 로드 성공")
except Exception as e:
    model = None
    print(f"모델 로드 실패: {e}")

# 토크나이저 로드
try:
    tokenizer = Tokenizer()  # 실제 토크나이저 로드 방법에 맞게 수정 필요
    print("토크나이저 로드 성공")
except Exception as e:
    tokenizer = None
    print(f"토크나이저 로드 실패: {e}")

@app.route('/api/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({'error': 'Model not loaded'}), 500
    if tokenizer is None:
        return jsonify({'error': 'Tokenizer not loaded'}), 500

    try:
        data = request.get_json()
        if 'message' not in data:
            return jsonify({'error': 'No message field in request'}), 400
        
        message = data['message']
        
        # 데이터 전처리
        sequences = tokenizer.texts_to_sequences([message])
        padded_sequences = pad_sequences(sequences, maxlen=100)  # maxlen은 모델에 맞게 설정
        
        # 예측
        prediction = model.predict(np.array(padded_sequences))
        return jsonify({'prediction': prediction.tolist()})
    except Exception as e:
        print(f"예측 실패: {e}")  # 서버 로그에 오류를 출력
        return jsonify({'error': f'Prediction failed: {e}'}), 500

if __name__ == '__main__':
    app.run(port=5000)
