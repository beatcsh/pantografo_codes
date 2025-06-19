import HomeButton from '../../components/HomeButton'
import { useEffect, useState, useRef } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'
import FilesConverter from './FilesConverter'
import MenuConverter from './MenuConverter'
import FormConverter from './FormConverter'
import 'aos/dist/aos.css'
import './Converter.css'
import AOS from "aos"
import axios from 'axios'

const API_URL = 'http://localhost:8000';

const Converter = (props) => {
  const { onContentReady, robot_ip, onLogout } = props;
  const [tabla, setTabla] = useState([]);
  const [tablaHeaders, setTablaHeaders] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
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
    'Uso': 0,
    'Profundidad de Corte': 1,
    'Pasadas': 1
  });
  const [file, setFile] = useState(null);
  const [convertLoading, setConvertLoading] = useState(false);
  const [convertError, setConvertError] = useState('');
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('select');
  const fileInputRef = useRef();

  useEffect(() => {
    AOS.init()
    axios.get(`${API_URL}/tabla`)
      .then(res => {
        const data = res.data;
        if (Array.isArray(data) && data.length > 0) {
          setTabla(data);
          setTablaHeaders(Object.keys(data[0]));
          if (onContentReady) onContentReady();
        }
      })
      .catch(() => setTabla([]));
  }, [onContentReady]);

  const handleRowSelect = (row) => {
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
    setForm(f => ({
      ...f,
      'Material': row['Material'] || '',
      'Corriente (A)': row['Corriente (A)'] || '',
      'Espesor (mm)': row['Espesor (mm)'] || '',
      'Velocidad corte (mm/s)': row['Velocidad corte (mm/s)'] || ''
    }));
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

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
    const params = {
      velocidad: form['Velocidad corte (mm/s)'] || 100,
      velocidadj: form['Velocidad J'] || 30,
      z_altura: form['Z'] || 7,
      uf: form['User Frame'] || 1,
      ut: form['Tool'] || 0,
      uso: form['Uso'] || 0,
      kerf: form['Kerf'] || 10,
      zp: form['Profundidad de Corte'] || 1,
      pa: form['Pasadas'] || 1
    };
    try {
      const res = await axios.post(`${API_URL}/convert/`, formData, {
        params,
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: res.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      setDownloadUrl(url);
      setTimeout(() => {
        if (window.confirm('¿Quieres enviar el archivo JBI al robot por FTP?')) {
          enviarPorFTP(file.name.replace(/\.[^.]+$/, '.JBI'));
        }
      }, 100);
    } catch (err) {
      setConvertError('Error al convertir el archivo.');
    }
    setConvertLoading(false);
  };

  const enviarPorFTP = async (jbiFileName) => {
    try {
      const res = await axios.get(`${API_URL}/enviar-ftp`, {
        params: {
          filename: jbiFileName,
          FTP_HOST: robot_ip
        }
      });
      if (res.status === 200) {
        alert('Archivo enviado exitosamente al robot.');
      } else {
        alert('Error al enviar el archivo por FTP.');
      }
    } catch {
      alert('Error de red al enviar por FTP.');
    }
  };

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
      <HomeButton />

      {view === 'select' && (
        <MenuConverter setView={setView} />
      )}
      {view === 'convert' && (
        <FormConverter
          setView={setView}
          tabla={tabla}
          setFile={setFile}
          file={file}
          form={form}
          handleFormChange={handleFormChange}
          handleRowSelect={handleRowSelect}
          handleConvert={handleConvert}
          convertError={convertError}
          convertLoading={convertLoading}
        />
      )}
      {view === 'files' && (
        <FilesConverter setView={setView} search={search} setSearch={setSearch} robot_ip={robot_ip}/>
      )}
    </div>
  );
};

export default Converter;
