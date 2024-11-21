import { useState } from "react";
import axios from "axios";

const OCRForm = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [formValues, setFormValues] = useState({
    apellidoPaterno: "",
    apellidoMaterno: "",
    nombre: "",
    curp: "",
  });
  const [ocrResult, setOcrResult] = useState(null);

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
    "MÉXICO",
    "FECHA",
    "FECHA DE",
    "NACIMIENTO",
    "28/11/2000",
    "26/1212000",
  ];

  const isCURP = (text) => {
    // Si comienza con "CURP", recorta esa parte
    if (text.startsWith("CURP")) {
      text = text.slice(4).trim(); // Quita "CURP" y elimina espacios adicionales
    }
    // Validar el formato de CURP
    const curpRegex = /^[A-Z]{4}\d{6}[A-Z]{6}[A-Z]\d$/;
    return curpRegex.test(text);
  };

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
      let apellidoCount = 0;

      ocrResult.forEach((item) => {
        let text = item.text.toUpperCase();

        // Mostrar en consola para depuración
        console.log("Procesando:", text);

        // Ignorar palabras no deseadas
        if (palabrasIgnoradas.some((palabra) => text.includes(palabra))) {
          console.log("Ignorado:", text);
          return;
        }

        // Detectar CURP
        if (isCURP(text) && !newFormValues.curp) {
          console.log("CURP detectada:", text);
          newFormValues.curp = text.startsWith("CURP")
            ? text.slice(4).trim()
            : text; // Corta "CURP" si está al inicio
        }
        // Detectar Apellidos y Nombres
        else if (apellidoCount === 0) {
          console.log("Apellido Paterno detectado:", text);
          newFormValues.apellidoPaterno = text;
          apellidoCount++;
        } else if (apellidoCount === 1) {
          console.log("Apellido Materno detectado:", text);
          newFormValues.apellidoMaterno = text;
          apellidoCount++;
        } else if (!newFormValues.nombre) {
          console.log("Nombre detectado:", text);
          newFormValues.nombre = text;
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
        <button type="submit" className="submit-button">
          Upload and Process
        </button>
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
        <br />
        <label>
          Apellido Materno:
          <input
            type="text"
            name="apellidoMaterno"
            value={formValues.apellidoMaterno}
            onChange={handleInputChange}
          />
        </label>
        <br />
        <label>
          Nombre:
          <input
            type="text"
            name="nombre"
            value={formValues.nombre}
            onChange={handleInputChange}
          />
        </label>
        <br />
        <label>
          CURP:
          <input
            type="text"
            name="curp"
            value={formValues.curp}
            onChange={handleInputChange}
          />
        </label>
      </form>
    </div>
  );
};

export default OCRForm;
