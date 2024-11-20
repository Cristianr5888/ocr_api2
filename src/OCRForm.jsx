import { useState } from "react";
import axios from "axios";

const OCRForm = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [formValues, setFormValues] = useState({
    apellidoPaterno: "",
    apellidoMaterno: "",
    nombre: "",
    curp: "",
    edad: "",
    fechaNac: "",
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

  const calcularEdadYFechaNacimiento = (curp) => {
    if (!curp || curp.length < 10) return { fechaNacimiento: "", edad: "" };

    const año = parseInt(curp.slice(4, 6), 10);
    const mes = parseInt(curp.slice(6, 8), 10) - 1; // Mes es 0-indexado
    const día = parseInt(curp.slice(8, 10), 10);

    // Determinar siglo
    const siglo = año < 50 ? 2000 : 1900;
    const fechaNacimiento = new Date(siglo + año, mes, día);

    // Calcular edad
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
    if (
      hoy.getMonth() < fechaNacimiento.getMonth() ||
      (hoy.getMonth() === fechaNacimiento.getMonth() &&
        hoy.getDate() < fechaNacimiento.getDate())
    ) {
      edad--;
    }

    return {
      fechaNacimiento: fechaNacimiento.toISOString().split("T")[0], // Formato YYYY-MM-DD
      edad: edad.toString(),
    };
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
          console.log("Ignorado por palabras no deseadas:", text);
          return;
        }
      
        // Verificar que el texto comience con letras
        if (!/^[A-Z]/.test(text)) {
          console.log("Ignorado por comenzar con número:", text);
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

      formValues.fechaNac = calcularEdadYFechaNacimiento(formValues.fechaNacimiento);
      
      // Validar y corregir valores basados en la CURP
      function obtenerPrimeraVocal(texto) {
        const vocales = texto.match(/[AEIOU]/);
        return vocales ? vocales[0] : ""; // Retorna la primera vocal encontrada o una cadena vacía
      }
      
      function validarYCorregirCampos(formValues) {
        const curp = formValues.curp || "";
        const primerCaracter = curp.slice(0, 1); // Primera consonante del apellido paterno
        const segundoCaracter = curp.slice(1, 2); // Primera vocal del apellido paterno
        const tercerCaracter = curp.slice(2, 3); // Primer carácter del apellido materno
        const cuartoCaracter = curp.slice(3, 4); // Primer carácter del nombre
      
        // Validar Apellido Paterno
        const primeraVocalApellidoPaterno = obtenerPrimeraVocal(formValues.apellidoPaterno || "");
        if (
          !formValues.apellidoPaterno.startsWith(primerCaracter) || 
          primeraVocalApellidoPaterno !== segundoCaracter
        ) {
          console.log("Corrigiendo Apellido Paterno...");
          if (
            formValues.nombre.startsWith(primerCaracter) && 
            obtenerPrimeraVocal(formValues.nombre) === segundoCaracter
          ) {
            [formValues.apellidoPaterno, formValues.nombre] = [
              formValues.nombre,
              formValues.apellidoPaterno,
            ];
          } else if (
            formValues.apellidoMaterno.startsWith(primerCaracter) && 
            obtenerPrimeraVocal(formValues.apellidoMaterno) === segundoCaracter
          ) {
            [formValues.apellidoPaterno, formValues.apellidoMaterno] = [
              formValues.apellidoMaterno,
              formValues.apellidoPaterno,
            ];
          }
        }
      
        // Validar Apellido Materno
        if (!formValues.apellidoMaterno.startsWith(tercerCaracter)) {
          console.log("Corrigiendo Apellido Materno...");
          if (formValues.nombre.startsWith(tercerCaracter)) {
            [formValues.apellidoMaterno, formValues.nombre] = [
              formValues.nombre,
              formValues.apellidoMaterno,
            ];
          }
        }
      
        // Validar Nombre
        if (!formValues.nombre.startsWith(cuartoCaracter)) {
          console.log("Corrigiendo Nombre...");
          if (formValues.apellidoMaterno.startsWith(cuartoCaracter)) {
            [formValues.nombre, formValues.apellidoMaterno] = [
              formValues.apellidoMaterno,
              formValues.nombre,
            ];
          }
        }
      }
      
      
      // Llamar a la validación después de procesar los valores
      validarYCorregirCampos(newFormValues);
      
      console.log("Valores finales:", newFormValues);
      
      

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
        <br />
        <label>
          Fecha de Nacimiento:
          <input
            type="text"
            name="fechaNac"
            value={formValues.fechaNac}
            onChange={handleInputChange}
          />
        </label>
        <br />
        <label>
          Edad: 
          <input
            type="text"
            name="edad"
            value={formValues.edad}
            onChange={handleInputChange}
          />
        </label>
      </form>
    </div>
  );
};

export default OCRForm;
