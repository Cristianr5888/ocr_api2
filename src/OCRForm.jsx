import { useState } from "react";
import axios from "axios";

const OCRForm = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [formValues, setFormValues] = useState({
    nombre: "",
    curp: "",
    // Agrega más campos según sea necesario
  });
  const [ocrResult, setOcrResult] = useState(null);

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

      // Procesar el resultado del OCR para actualizar el formulario
      const ocrResult = response.data;
      setOcrResult(ocrResult); // Mostrar el resultado en JSON

      const newFormValues = { ...formValues };

      ocrResult.forEach((item) => {
        if (item.text.toUpperCase().includes("NOMBRE")) {
          newFormValues.nombre = item.text;
        } else if (item.text.toUpperCase().includes("CURP")) {
          newFormValues.curp = item.text;
        }
        // Agrega más condiciones según los campos que necesites llenar
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
          Nombre:
          <input
            type="text"
            name="nombre"
            value={formValues.nombre}
            onChange={handleInputChange}
          />
        </label>
        <label>
          CURP:
          <input
            type="text"
            name="curp"
            value={formValues.curp}
            onChange={handleInputChange}
          />
        </label>
        {/* Agrega más campos según sea necesario */}
      </form>
    </div>
  );
};

export default OCRForm;
