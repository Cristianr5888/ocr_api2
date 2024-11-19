from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
from paddleocr import PaddleOCR
import json
import Levenshtein

app = Flask(__name__)
CORS(app)
#hola
ocr = PaddleOCR(use_angle_cls=True, lang='es')

# Diccionario de palabras comunes que deberían tener "Ñ"
diccionario_ñ = ["AÑO", "NUÑEZ", "ZUÑIGA", "MUÑOZ", "IBAÑEZ", "CASTAÑO", "MUÑIZ", "PEÑA", "PIÑA", "OCAÑA", "CASTAÑEDA", "CARREÑO"]

def corregir_palabras(palabra_detectada):
    if palabra_detectada.isupper():
        palabra_corregida = min(diccionario_ñ, key=lambda x: Levenshtein.distance(palabra_detectada, x))
        if Levenshtein.distance(palabra_detectada, palabra_corregida) <= 2:
            return palabra_corregida
    return palabra_detectada

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
        if confidence > threshold:
            texto_corregido = corregir_palabras(text)
            resultado_corregido.append({"text": texto_corregido, "confidence": confidence})

    return jsonify(resultado_corregido)

if __name__ == '__main__':
    app.run(debug=True)
