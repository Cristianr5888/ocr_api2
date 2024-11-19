import { useState } from "react";
import axios from "axios";

const OCRForm = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [formValues, setFormValues] = useState({
    apellidoPaterno: "",
    apellidoMaterno: "",
    nombre: "",
    fechaNacimiento: "",
  });
  const [ocrResult, setOcrResult] = useState(null);

  const isDateLike = (text) => {
    // Expresión regular para detectar fechas posibles
    const dateRegex = /(\\d{1,2})[\\/\\.\\-]?(\\d{1,2})[\\/\\.\\-]?(\\d{4})/;
    const match = text.match(dateRegex);

    if (match) {
      const day = match[1].padStart(2, "0");
      const month = match[2].padStart(2, "0");
      const year = match[3];
      // Verifica si es una fecha válida
      if (parseInt(day) <= 31 && parseInt(month) <= 12 && year.length === 4) {
        return `${day}/${month}/${year}`; // Devuelve la fecha formateada
      }
    }
    return null; // No es una fecha válida
  };

  const palabrasIgnoradas = [
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
    "CURP",
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
  ];

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await axios.post("http://localhost:5000/ocr", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const ocrResult = response.data;
      setOcrResult(ocrResult); // Mostrar el resultado en JSON

      const newFormValues = { ...formValues };
      let detectados = 0; // Para controlar el orden de asignación

      ocrResult.forEach((item) => {
        const text = item.text.trim();
        const upperText = text.toUpperCase();

        // Ignorar palabras específicas
        if (!palabrasIgnoradas.includes(upperText) && item.confidence > 0.9) {
          const formattedDate = isDateLike(text); // Intenta formatear como fecha

          if (formattedDate) {
            // Asigna al campo de fecha de nacimiento si es una fecha válida
            newFormValues.fechaNacimiento = formattedDate;
          } else if (detectados === 0) {
            newFormValues.apellidoPaterno = text;
          } else if (detectados === 1) {
            newFormValues.apellidoMaterno = text;
          } else if (detectados === 2) {
            newFormValues.nombre = text;
          }
          detectados++;
        }
      });

      setFormValues(newFormValues);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormValues({ ...formValues, [name]: value });
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input type="file" accept="image/*" onChange={handleFileChange} />
        <button type="submit">Upload and Process</button>
      </form>
      {ocrResult && (
        <div>
          <h3>OCR Result (JSON):</h3>
          <pre>{JSON.stringify(ocrResult, null, 2)}</pre>
        </div>
      )}
      <form>
        <label>
          Apellido Paterno:
          <input
            type="text"
            name="apellidoPaterno"
            value={formValues.apellidoPaterno}
            onChange={handleInputChange}
          />
        </label>
        <label>
          Apellido Materno:
          <input
            type="text"
            name="apellidoMaterno"
            value={formValues.apellidoMaterno}
            onChange={handleInputChange}
          />
        </label>
        <label>
          Nombre/s:
          <input
            type="text"
            name="nombre"
            value={formValues.nombre}
            onChange={handleInputChange}
          />
        </label>
        <label>
          Fecha de Nacimiento:
          <input
            type="text"
            name="fechaNacimiento"
            value={formValues.fechaNacimiento}
            onChange={handleInputChange}
          />
        </label>
      </form>
    </div>
  );
};

export default OCRForm;
