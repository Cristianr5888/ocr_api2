from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
from paddleocr import PaddleOCR
import json

app = Flask(__name__)
CORS(app)

ocr = PaddleOCR(use_angle_cls=True, lang='es')

# Lista de palabras ignoradas

palabras_ignoradas = [
     "INSTITUTO",
    "NACIONAL",
    "ELECTORAL",
    "NOMBRE",
    "DOMICILIO",
    "MEXICO",
    "CREDENCIAL",
    "VOTAR",
    "SEXO",
    "ANO DE REGISTRO",
    "SECCION",
    "VIGENCIA",
    "MUNICIPIO",
    "LOCALIDAD",
    "ESTADO",
    "EMISION",
    "VIGENCIA",
    "REGISTRO",
    "FEDERAL",
    "ELECTORES",
    "REGISTRO FEDERALDE ELECTORES",

]

# Diccionario para corregir apellidos
diccionario_ñ = {
    "ANO": "AÑO", "NUNEZ": "NUÑEZ", "ZUNIGA": "ZUÑIGA", 
    "MUNOZ": "MUÑOZ", "IBANEZ": "IBAÑEZ", "CASTANO": "CASTAÑO", 
    "MUNIZ": "MUÑIZ", "PENA": "PEÑA", "PINA": "PIÑA", 
    "OCANA": "OCAÑA", "CASTANEDA": "CASTAÑEDA", "CARRENO": "CARREÑO"
}

def corregir_texto(texto):
    """
    Corrige palabras específicas en base al diccionario_ñ.
    """
    palabras = texto.split()
    palabras_corregidas = [
        diccionario_ñ.get(palabra.upper(), palabra) for palabra in palabras
    ]
    return " ".join(palabras_corregidas)

@app.route('/ocr', methods=['POST'])
def ocr_imagen():
    if 'file' not in request.files:
        return "No file part", 400

    file = request.files['file']
    img = cv2.imdecode(np.frombuffer(file.read(), np.uint8), cv2.IMREAD_COLOR)
    results = ocr.ocr(img, cls=True)

    threshold = 0.15  # Umbral de confianza mínimo
    resultado_corregido = []
    for line in results[0]:
        text, confidence = line[1][0], line[1][1]
        # Filtrar palabras ignoradas y corregir texto
        if confidence > threshold and not any(palabra in text.upper() for palabra in palabras_ignoradas):
            texto_corregido = corregir_texto(text)
            resultado_corregido.append({"text": texto_corregido, "confidence": confidence})

    return jsonify(resultado_corregido)

if __name__ == '__main__':
    app.run(debug=True)