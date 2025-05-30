import React, { useEffect, useState, useRef } from 'react';
import { Button, Spinner, Alert } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Converter.css';
import { FaUpload, FaTrashAlt } from 'react-icons/fa';

const API_URL = 'http://localhost:8000';

const Converter = () => {
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
    'Plasma': 1
  });
  const [file, setFile] = useState(null);
  const [convertLoading, setConvertLoading] = useState(false);
  const [convertError, setConvertError] = useState('');
  const [downloadUrl, setDownloadUrl] = useState(null);
  // Estados para archivos JBI en robot
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState('');
  const [search, setSearch] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [view, setView] = useState('select'); // 'select', 'convert', 'files'
  const fileInputRef = useRef();

  // Cargar tabla de parámetros al montar
  useEffect(() => {
    fetch(`${API_URL}/tabla`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setTabla(data);
          setTablaHeaders(Object.keys(data[0]));
        }
      })
      .catch(() => setTabla([]));
  }, []);

  // Cargar archivos JBI
  const fetchJobs = () => {
    setJobsLoading(true);
    fetch(`${API_URL}/listar-jobs`)
      .then(res => res.json())
      .then(data => {
        setJobs(Array.isArray(data) ? data : []);
        setJobsLoading(false);
      })
      .catch(() => {
        setJobs([]);
        setJobsLoading(false);
      });
  };
  useEffect(fetchJobs, []);

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
      pc: form['Plasma'] || 1
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
        fetchJobs();
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
        fetchJobs(); // Actualiza la lista de archivos JBI tras envío exitoso
      } else {
        alert('Error al enviar el archivo por FTP.');
      }
    } catch {
      alert('Error de red al enviar por FTP.');
    }
  };

  // Eliminar archivo JBI
  const handleDelete = async (idx) => {
    setDeleteLoading(idx);
    try {
      const res = await fetch(`${API_URL}/borrar?idx=${idx}`, { method: 'DELETE' });
      if (res.ok) fetchJobs();
      else setJobsError('No se pudo eliminar el archivo.');
    } catch {
      setJobsError('Error de red al eliminar.');
    }
    setDeleteLoading(null);
  };

  // Render
  return (
    <div
      className="converter-bg"
      style={{
        minHeight: '100vh',
        width: '100vw',
        overflow: 'hidden',
        position: 'relative',
        background: "url('/assets/fondo.jpeg') center center/cover no-repeat fixed"
      }}
    >
      {view === 'select' && (
        <div className="converter-select-container converter-select-bottom-exact">
          <div className="converter-select-row-exact">
            <div className="converter-btn-card-exact" tabIndex={0} onClick={() => setView('files')}>
              <img src="/assets/File_browser.png" alt="Files" className="converter-btn-img-exact" />
              <div className="converter-btn-title-exact">FILES</div>
              <div className="converter-btn-desc-exact">Here you can view and manage<br/>the files uploaded to the robot.</div>
            </div>
            <div className="converter-btn-card-exact" tabIndex={0} onClick={() => setView('convert')}>
              <img src="/assets/Converter.png" alt="Converter" className="converter-btn-img-exact" />
              <div className="converter-btn-title-exact">CONVERTER</div>
              <div className="converter-btn-desc-exact">It is an application that allows the<br/>conversion of .dxf files to inform II language.</div>
            </div>
          </div>
        </div>
      )}
      {/* CONVERT VIEW: solo el convertidor */}
      {view === 'convert' && (
        <div className="converter-flex-exact">
          {/* Botón de volver arriba a la derecha */}
          <div className="converter-header-bar">
            <button className="converter-back-btn" onClick={() => setView('select')}>
              ← Back
            </button>
          </div>
          {/* Panel izquierdo: Tabla de parámetros */}
          <div className="converter-table-panel-exact">
            <div className="converter-table-title-row">
              <div className="converter-table-title">CUT PARAMETERS</div>
              <div className="converter-table-title-underline" />
            </div>
            <div className="converter-table-headers-row">
              <div className="converter-table-header">MATERIAL</div>
              <div className="converter-table-header">CURRENT</div>
              <div className="converter-table-header">WIDTH (mm)</div>
              <div className="converter-table-header">SPEED CUT (mm/s)</div>
            </div>
            <div className="converter-table-list converter-table-scrollable">
              {tabla.map((row, i) => (
                <div className="converter-table-row" key={i} onClick={() => handleRowSelect(row)}>
                  <div className="converter-table-cell converter-table-cell-material">{row['Material']}</div>
                  <div className="converter-table-cell">{row['Corriente (A)']} A</div>
                  <div className="converter-table-cell">{row['Espesor (mm)']}</div>
                  <div className="converter-table-cell">{row['Velocidad corte (mm/s)']}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Panel derecho: Formulario de conversión */}
          <div className="converter-form-panel-exact">
            <div className="converter-form-title">CONVERT .DXF TO INFORM II</div>
            <div className="converter-form-subtitle">(SELECT A .DXF FILE TO CONVERT TO ROBOT YASKAWA LENGUAJE)</div>
            <div className="converter-form-file-row">
              <label className="converter-form-file-btn">
                SELECT YOUR FILE
                <input type="file" accept=".dxf" style={{display:'none'}} onChange={e => setFile(e.target.files[0])} />
              </label>
              <div className="converter-form-file-name">{file ? file.name : ''}</div>
            </div>
            <form onSubmit={handleConvert} className="converter-form-fields-grid">
              <div className="converter-form-field-group">
                <label className="converter-form-label">MATERIAL</label>
                <input className="converter-form-input" name="Material" value={form['Material']} onChange={handleFormChange} />
              </div>
              <div className="converter-form-field-group">
                <label className="converter-form-label">J SPEED</label>
                <input className="converter-form-input" name="Velocidad J" value={form['Velocidad J']} onChange={handleFormChange} />
              </div>
              <div className="converter-form-field-group">
                <label className="converter-form-label">CURRENT</label>
                <input className="converter-form-input" name="Corriente (A)" value={form['Corriente (A)']} onChange={handleFormChange} />
              </div>
              <div className="converter-form-field-group">
                <label className="converter-form-label">Z POSITION</label>
                <input className="converter-form-input" name="Z" value={form['Z']} onChange={handleFormChange} />
              </div>
              <div className="converter-form-field-group">
                <label className="converter-form-label">WIDTH</label>
                <input className="converter-form-input" name="Espesor (mm)" value={form['Espesor (mm)']} onChange={handleFormChange} />
              </div>
              <div className="converter-form-field-group">
                <label className="converter-form-label">USER FRAME</label>
                <input className="converter-form-input" name="User Frame" value={form['User Frame']} onChange={handleFormChange} />
              </div>
              <div className="converter-form-field-group">
                <label className="converter-form-label">SPEED CUT</label>
                <input className="converter-form-input" name="Velocidad corte (mm/s)" value={form['Velocidad corte (mm/s)']} onChange={handleFormChange} />
              </div>
              <div className="converter-form-field-group">
                <label className="converter-form-label">TOOL</label>
                <input className="converter-form-input" name="Tool" value={form['Tool']} onChange={handleFormChange} />
              </div>
              <div className="converter-form-field-group">
                <label className="converter-form-label">PLASMA</label>
                <input className="converter-form-input" name="Plasma" value={form['Plasma']} onChange={handleFormChange} />
              </div>
            </form>
            <button className="converter-form-submit-btn" type="submit" onClick={handleConvert} disabled={convertLoading}>
              CONVERT & UPLOAD <FaUpload style={{marginLeft:10, marginBottom:-3}} />
            </button>
            {convertError && <div className="converter-form-error">{convertError}</div>}
            {downloadUrl && (
              <a href={downloadUrl} download={file ? file.name.replace(/\.[^.]+$/, '.JBI') : 'programa.jbi'} className="converter-form-download-link">Descargar archivo .JBI</a>
            )}
          </div>
        </div>
      )}
      {/* FILES VIEW: solo gestor de archivos */}
      {view === 'files' && (
        <div style={{
          background: '#f3f3f3',
          borderRadius: 16,
          padding: '32px 18px 24px 18px',
          maxWidth: 700,
          margin: '40px auto',
          boxShadow: '0 8px 32px 0 #0002',
          fontFamily: 'Arial, sans-serif',
          minHeight: 420,
        }}>
          <button
            onClick={() => setView('select')}
            style={{
              background: '#1976d2',
              color: '#fff',
              fontWeight: 700,
              fontFamily: 'Arial Black',
              border: 'none',
              borderRadius: 10,
              padding: '10px 22px',
              fontSize: '1.1em',
              marginBottom: 18,
              float: 'right',
              cursor: 'pointer',
              transition: 'background 0.18s',
            }}
            onMouseOver={e => e.currentTarget.style.background = '#0056b3'}
            onMouseOut={e => e.currentTarget.style.background = '#1976d2'}
          >
            ← Back
          </button>
          <div style={{clear:'both'}}></div>
          <div style={{fontWeight: 900, fontSize: '2.1em', color: '#1976d2', letterSpacing: 1, marginBottom: 10, fontFamily: 'Arial Black, Arial, sans-serif', textAlign: 'left'}}>
            JBI FILES IN TO THE ROBOT
          </div>
          <input
            type="text"
            placeholder="SEARCH FILE . . ."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              maxWidth: 340,
              marginBottom: 18,
              borderRadius: 10,
              border: '2px solid #bbb',
              padding: '12px 18px',
              fontSize: '1.15em',
              fontWeight: 600,
              color: '#222',
              background: '#fff',
              outline: 'none',
              fontFamily: 'Arial, sans-serif',
            }}
          />
          <div style={{
            background: '#0073ff',
            borderRadius: '12px 12px 0 0',
            color: '#fff',
            fontWeight: 800,
            fontSize: '1.18em',
            display: 'flex',
            flexDirection: 'row',
            padding: '10px 0 10px 0',
            marginBottom: 0,
            letterSpacing: 1,
            fontFamily: 'Arial Black, Arial, sans-serif',
          }}>
            <div style={{flex: '0 0 60px', textAlign: 'center'}}>ID</div>
            <div style={{flex: 2, textAlign: 'center'}}>FILE NAME</div>
            <div style={{flex: 1, textAlign: 'center'}}>ACTION</div>
          </div>
          <div style={{
            maxHeight: 320,
            overflowY: 'auto',
            background: '#f3f3f3',
            borderRadius: '0 0 12px 12px',
            boxShadow: '0 8px 18px 0 #0002',
          }}>
            {jobsLoading ? (
              <div style={{textAlign:'center', padding: 30}}><Spinner animation="border" /></div>
            ) : (
              jobs.filter(j => j.toLowerCase().includes(search.toLowerCase())).map((j, i) => (
                <div key={j} style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderBottom: '1px solid #e0e0e0',
                  fontSize: '1.25em',
                  fontFamily: 'Roboto Mono, Consolas, monospace',
                  color: '#222',
                  background: i%2===0 ? '#fff' : '#f3f3f3',
                  padding: '0 0',
                  minHeight: 54,
                }}>
                  <div style={{flex: '0 0 60px', textAlign: 'center', fontWeight: 700}}>{i+1}</div>
                  <div style={{flex: 2, textAlign: 'center', fontWeight: 700, letterSpacing: 1}}>{j}</div>
                  <div style={{flex: 1, textAlign: 'center'}}>
                    <Button
                      variant="danger"
                      size="sm"
                      style={{
                        borderRadius: 10,
                        fontWeight: 700,
                        fontSize: '1.05em',
                        background: '#ff2222',
                        border: 'none',
                        padding: '6px 12px',
                        boxShadow: '0 2px 8px #0002',
                        letterSpacing: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: 0,
                        width: 38,
                        height: 38,
                        margin: '0 auto',
                      }}
                      disabled={deleteLoading===i}
                      onClick={() => handleDelete(i)}
                    >
                      {deleteLoading===i ? <Spinner size="sm" animation="border" /> : <FaTrashAlt size={20} />}
                    </Button>
                  </div>
                </div>
              ))
            )}
            {jobsError && <Alert variant="danger">{jobsError}</Alert>}
          </div>
        </div>
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



/*🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧
🟧⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛🟧⬛⬛⬛⬛⬛⬛⬛⬛⬛🟧⬛⬛⬛⬛⬛⬛⬛⬛⬛🟧⬛⬛⬛🟧🟧🟧⬛⬛⬛⬛🟧
🟧🟧⬛⬛⬛⬛⬛⬛⬛⬛⬛🟧⬛⬛⬛⬛⬛⬛⬛⬛⬛🟧⬛⬛⬛⬛⬛⬛⬛⬛⬛🟧⬛⬛⬛🟧🟧🟧⬛⬛⬛🟧🟧
⬜🟧⬛⬛⬛⬛⬛⬛⬛⬛⬛🟧⬛⬛⬛⬛⬛⬛⬛⬛⬛🟧⬛⬛⬛⬛⬛⬛⬛⬛⬛🟧⬛⬛⬛⬛🟧⬛⬛⬛⬛🟧⬜
⬜🟧⬛⬛⬛🟧🟧🟧⬛⬛⬛🟧⬛⬛⬛🟧🟧🟧⬛⬛⬛🟧⬛⬛⬛🟧🟧🟧⬛⬛⬛🟧⬛⬛⬛⬛⬛⬛⬛⬛⬛🟧⬜
⬜🟧⬛⬛⬛🟧🟧🟧⬛⬛⬛🟧⬛⬛⬛🟧🟧🟧⬛⬛⬛🟧⬛⬛⬛🟧🟧🟧⬛⬛⬛🟧⬛⬛⬛⬛⬛⬛⬛⬛⬛🟧⬜
⬜🟧⬛⬛⬛🟧🟧🟧⬛⬛⬛🟧⬛⬛⬛🟧🟧🟧⬛⬛⬛🟧⬛⬛⬛🟧🟧🟧⬛⬛⬛🟧⬛⬛⬛⬛⬛⬛⬛⬛⬛🟧⬜
⬜🟧⬛⬛⬛🟧🟧🟧⬛⬛⬛🟧⬛⬛⬛🟧🟧🟧⬛⬛⬛🟧⬛⬛⬛🟧🟧🟧⬛⬛⬛🟧⬛⬛⬛⬛⬛⬛⬛⬛⬛🟧⬜
⬜🟧⬛⬛⬛🟧🟧🟧⬛⬛⬛🟧⬛⬛⬛🟧🟧🟧⬛⬛⬛🟧⬛⬛⬛🟧🟧🟧⬛⬛⬛🟧⬛⬛⬛⬛⬛⬛⬛⬛⬛🟧⬜
⬜🟧⬛⬛⬛🟧🟧🟧⬛⬛⬛🟧⬛⬛⬛🟧🟧🟧⬛⬛⬛🟧⬛⬛⬛🟧🟧🟧⬛⬛⬛🟧⬛⬛⬛⬛⬛⬛⬛⬛⬛🟧⬜
⬜🟧⬛⬛⬛🟧🟧🟧⬛⬛⬛🟧⬛⬛⬛🟧🟧🟧⬛⬛⬛🟧⬛⬛⬛🟧🟧🟧⬛⬛⬛🟧⬛⬛⬛⬛⬛⬛⬛⬛⬛🟧⬜
⬜🟧⬛⬛⬛🟧🟧🟧⬛⬛⬛🟧⬛⬛⬛🟧🟧🟧⬛⬛⬛🟧⬛⬛⬛🟧🟧🟧⬛⬛⬛🟧⬛⬛⬛⬛⬛⬛⬛⬛⬛🟧⬜
⬜🟧⬛⬛⬛🟧🟧🟧⬛⬛⬛🟧⬛⬛⬛🟧🟧🟧⬛⬛⬛🟧⬛⬛⬛🟧🟧🟧⬛⬛⬛🟧⬛⬛⬛⬛⬛⬛⬛⬛⬛🟧⬜
⬜🟧⬛⬛⬛🟧🟧🟧⬛⬛⬛🟧⬛⬛⬛🟧🟧🟧⬛⬛⬛🟧⬛⬛⬛🟧🟧🟧⬛⬛⬛🟧⬛⬛⬛🟧⬛🟧⬛⬛⬛🟧⬜
⬜🟧⬛⬛⬛🟧🟧⬛⬛⬛⬛🟧⬛⬛⬛⬛🟧🟧⬛⬛⬛🟧⬛⬛⬛🟧🟧⬛⬛⬛⬛🟧⬛⬛⬛🟧🟧🟧⬛⬛⬛🟧⬜
⬜🟧⬛⬛⬛🟧⬛⬛⬛⬛🟧🟧🟧⬛⬛⬛⬛⬛⬛⬛⬛🟧⬛⬛⬛⬛⬛⬛⬛⬛🟧🟧🟧⬛⬛🟧⬜🟧⬛⬛⬛🟧⬜
⬜🟧⬛⬛⬛⬛⬛⬛⬛🟧🟧⬜🟧🟧⬛⬛⬛⬛⬛⬛🟧🟧🟧⬛⬛⬛⬛⬛⬛🟧🟧⬜🟧⬛⬛🟧⬜🟧⬛⬛⬛🟧⬜
⬜🟧⬛⬛⬛⬛⬛⬛🟧🟧⬜⬜⬜🟧🟧⬛⬛⬛⬛🟧🟧⬜🟧🟧⬛⬛⬛⬛🟧🟧⬜⬜🟧🟧⬛🟧⬜🟧⬛⬛⬛🟧⬜
⬜🟧⬛⬛⬛⬛⬛🟧🟧⬜⬜⬜⬜⬜🟧🟧⬛⬛🟧🟧⬜⬜⬜🟧🟧⬛⬛🟧🟧⬜⬜⬜⬜🟧🟧🟧⬜🟧⬛⬛⬛🟧⬜
⬜🟧⬛⬛⬛⬛🟧🟧⬜⬜⬜⬜⬜⬜⬜🟧🟧🟧🟧⬜⬜⬜⬜⬜🟧🟧🟧🟧⬜⬜⬜⬜⬜⬜⬜⬜⬜🟧🟧⬛⬛🟧⬜
⬜🟧⬛⬛⬛🟧🟧⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜🟧⬛⬛🟧⬜
⬜🟧⬛⬛🟧🟧⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜🟧🟧⬛🟧⬜
⬜🟧⬛🟧🟧⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜🟧⬛🟧⬜
⬜🟧🟧🟧⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜🟧🟧🟧⬜*/