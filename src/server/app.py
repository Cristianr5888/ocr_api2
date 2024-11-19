from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
from paddleocr import PaddleOCR
import json

app = Flask(__name__)
CORS(app)

ocr = PaddleOCR(use_angle_cls=True, lang='es')

palabras_ignoradas = ["INSTITUTO", "NACIONAL", "ELECTORAL", "MEXICO", "CREDENCIAL", "VOTAR", "SEXO", "FECHADENACIMIENTO"]

@app.route('/ocr', methods=['POST'])
def ocr_imagen():
    if 'file' not in request.files:
        return "No file part", 400
    file = request.files['file']
    img = cv2.imdecode(np.frombuffer(file.read(), np.uint8), cv2.IMREAD_COLOR)
    results = ocr.ocr(img, cls=True)

    threshold = 0.15
    resultado_corregido = []
    for line in results[0]:
        text, confidence = line[1][0], line[1][1]
        if confidence > threshold and not any(palabra in text.upper() for palabra in palabras_ignoradas):
            resultado_corregido.append({"text": text, "confidence": confidence})

    return jsonify(resultado_corregido)

if __name__ == '__main__':
    app.run(debug=True)
