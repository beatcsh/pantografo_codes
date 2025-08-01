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
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content"

const API_URL = 'http://localhost:8000';
const MySwal = withReactContent(Swal)

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
    'Numero de Salida': 9,
    'Profundidad de Corte': 1,
    'Pasadas': 1,
    'Velocidad de Arco': 20
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
      'Corriente (A)': row['Current (A)'] || '',
      'Espesor (mm)': row['Thickness (mm)'] || '',
      'Velocidad corte (mm/s)': row['Cutting speed (mm/s)'] || ''
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
      velocidad: parseFloat(form['Velocidad corte (mm/s)']) || 100,
      velocidadj: parseInt(form['Velocidad J']) || 30,
      z_altura: parseFloat(form['Z']) || 7,
      uf: parseInt(form['User Frame']) || 1,
      ut: parseInt(form['Tool']) || 0,
      uso: parseInt(form['Uso']) || 0,
      kerf: parseFloat(form['Kerf']) || 10,
      pc: parseInt(form['Numero de Salida']) || 9,
      zp: parseFloat(form['Profundidad de Corte']) || 1,
      pa: parseInt(form['Pasadas']) || 1,
      aspeed: parseInt(form['Velocidad de Arco']) || 20
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
        if (window.confirm('¿Do you want to send the JBI to the robot?')) {
          enviarPorFTP(file.name.replace(/\.[^.]+$/, '.JBI'));
        }
      }, 100);
    } catch (err) {
      console.error(err);
      setConvertError('Conversion error.');
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
      if (res) {
        console.log('y el swal?')
        MySwal.fire({
          icon: "success",
          title: "File sent, please confirm on Teach Pendant, if it is not there check the params.",
          timer: 10000,
        })
      }
    } catch {
      MySwal.fire({
          icon: "success",
          title: "Something is wrong.",
          timer: 5000,
        })
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
        <FilesConverter setView={setView} search={search} setSearch={setSearch} robot_ip={robot_ip} />
      )}
    </div>
  );
};

export default Converter;
