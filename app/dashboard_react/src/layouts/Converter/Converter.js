import LogoutButton from '../../components/LogoutButton'
import HomeButton from '../../components/HomeButton'
import { useEffect, useState, useRef } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'
import FilesConverter from './FilesConverter'
import MenuConverter from './MenuConverter'
import FormConverter from './FormConverter'
import 'aos/dist/aos.css'
import './Converter.css'
import AOS from "aos"

const API_URL = 'http://localhost:8000';

const Converter = (props) => {
  const { onContentReady, user, onLogout } = props;
  // Estados para la tabla de parámetros
  const [tabla, setTabla] = useState([]);
  const [tablaHeaders, setTablaHeaders] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  // Estados para formulario de conversión
  const [form, setForm] = useState({
    'Material': '',
    'Corriente (A)': '',
    'Espesor (mm)': '',
    'Velocidad corte (mm/s)': '',
    'Velocidad J': 30,
    'Z': 7,
    'User Frame': 1,
    'Tool': 0,
    'Plasma': 1,
    'Kerf': 10,
    'Uso': 0
  });
  const [file, setFile] = useState(null);
  const [convertLoading, setConvertLoading] = useState(false);
  const [convertError, setConvertError] = useState('');
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('select'); // 'select', 'convert', 'files'
  const fileInputRef = useRef();

  // Cargar tabla de parámetros al montar
  useEffect(() => {
    AOS.init()
    fetch(`${API_URL}/tabla`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setTabla(data);
          setTablaHeaders(Object.keys(data[0]));
          if (onContentReady) onContentReady(); // Llama aquí cuando la info está lista
        }
      })
      .catch(() => setTabla([]));
  }, [onContentReady]);

  // Efecto para llamar a onContentReady cuando los datos están listos

  // Selección de fila de tabla
  const handleRowSelect = (row) => {
    // Si ya está seleccionada, deselecciona y limpia los parámetros
    if (selectedRow === row) {
      setSelectedRow(null);
      setForm(f => ({
        ...f,
        'Material': '',
        'Corriente (A)': '',
        'Espesor (mm)': '',
        'Velocidad corte (mm/s)': ''
      }));
      return;
    }
    setSelectedRow(row);
    // Autollenar campos del formulario
    setForm(f => ({
      ...f,
      'Material': row['Material'] || '',
      'Corriente (A)': row['Corriente (A)'] || '',
      'Espesor (mm)': row['Espesor (mm)'] || '',
      'Velocidad corte (mm/s)': row['Velocidad corte (mm/s)'] || ''
    }));
  };

  // Cambios en formulario
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  // Subir archivo y convertir
  const handleConvert = async (e) => {
    e.preventDefault();
    setConvertError('');
    setDownloadUrl(null);
    if (!file) {
      setConvertError('Selecciona un archivo DXF.');
      return;
    }
    setConvertLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    const params = new URLSearchParams({
      velocidad: form['Velocidad corte (mm/s)'] || 100,
      velocidadj: form['Velocidad J'] || 30,
      z_altura: form['Z'] || 7,
      uf: form['User Frame'] || 1,
      ut: form['Tool'] || 0,
      uso: form['Uso'] || 0,
      kerf: form['Kerf'] || 10
    });
    try {
      const res = await fetch(`${API_URL}/convert/?${params.toString()}`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        setDownloadUrl(url);
        // Preguntar si se quiere enviar por FTP
        setTimeout(() => {
          if (window.confirm('¿Quieres enviar el archivo JBI al robot por FTP?')) {
            enviarPorFTP(file.name.replace(/\.[^.]+$/, '.JBI'));
          }
        }, 100);
      } else {
        setConvertError('Error al convertir el archivo.');
      }
    } catch (err) {
      setConvertError('Error de red o del servidor.');
    }
    setConvertLoading(false);
  };

  // Enviar archivo por FTP
  const enviarPorFTP = async (jbiFileName) => {
    try {
      const res = await fetch(`${API_URL}/enviar-ftp?filename=${encodeURIComponent(jbiFileName)}`);
      if (res.ok) {
        alert('Archivo enviado exitosamente al robot.');
      } else {
        alert('Error al enviar el archivo por FTP.');
      }
    } catch {
      alert('Error de red al enviar por FTP.');
    }
  };

  // Render
  return (
    <div
      data-aos="zoom-in-up"
      className="converter-bg"
      style={{
        minHeight: '100vh',
        width: '100vw',
        overflow: 'hidden',
        position: 'relative',
        background: "url('/assets/fondo.jpeg') center center/cover no-repeat fixed"
      }}
    >
      <LogoutButton onLogout={ onLogout } />
      <HomeButton />

      {view === 'select' && (
        <MenuConverter setView={setView} />
      )}
      {/* CONVERT VIEW: solo el convertidor */}
      {view === 'convert' && (
        <FormConverter setView={setView} tabla={tabla} setFile={setFile} file={file} form={form} handleFormChange={handleFormChange} handleRowSelect={handleRowSelect} handleConvert={handleConvert} convertError={convertError} convertLoading={convertLoading} />
      )}
      {/* FILES VIEW: solo gestor de archivos */}
      {view === 'files' && (
        <FilesConverter setView={setView} search={search} setSearch={setSearch} />
      )}
    </div>
  );
};

export default Converter;
/*
CSS extra sugerido para Converter.css:

.home-card-select {
  position: relative;
  overflow: hidden;
}
.home-card-select:hover, .home-card-select:focus {
  box-shadow: 0 8px 40px 0 #007bff44, 0 1.5px 8px 0 #fff8;
  transform: translateY(-4px) scale(1.035);
  background: rgba(255,255,255,0.19);
  border: 1.5px solid #007bff44;
}
.card-hover-overlay {
  pointer-events: none;
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg,rgba(0,123,255,0.08) 0%,rgba(0,123,255,0.13) 100%);
  opacity: 0;
  transition: opacity 0.18s;
}
.home-card-select:hover .card-hover-overlay, .home-card-select:focus .card-hover-overlay {
  opacity: 1;
}
*/