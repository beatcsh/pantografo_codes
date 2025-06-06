import React, { useEffect, useState, useRef } from 'react';
import { Container, Row, Col, Table, Button, Form, Spinner, InputGroup, Alert, Card, Badge } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../App.css';
import { FaSignOutAlt } from 'react-icons/fa';

// Usa la misma API que Converter.js
const API_URL = 'http://localhost:8000';

const ModernDashboard = ({ user, onLogout }) => {
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
        fetchJobs();
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

  // --- UI ---
  return (
    <div style={{
      minHeight: '100vh',
      background: '#f3f4f8',
      padding: 0,
      fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
      color: '#1a3e7a',
      position: 'relative',
      overflowX: 'hidden',
    }}>
      {/* Logout button top left */}
      <button
        onClick={onLogout}
        style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 1000,
          background: 'rgba(255,255,255,0.92)',
          border: '2px solid #1976d2',
          color: '#1976d2',
          borderRadius: 12,
          fontWeight: 700,
          fontSize: 18,
          padding: '8px 18px 8px 14px',
          boxShadow: '0 2px 12px #1976d211',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
          transition: 'background 0.18s',
        }}
        title="Logout"
      >
        <FaSignOutAlt size={20} /> Logout
      </button>

      {/* Header superior */}
      <div style={{
        background: '#fff',
        borderBottom: '2px solid #e0e3ea',
        boxShadow: '0 4px 16px 0 #0001',
        padding: '18px 0 0 0',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <Container fluid>
          <Row className="align-items-center">
            <Col xs="auto">
              <img src="/logo192.png" alt="Logo" style={{ height: 44, borderRadius: 12, background: '#fff', padding: 2 }} />
            </Col>
            <Col>
              <div style={{ display: 'flex', gap: 24 }}>
                <Button variant="light" style={{ color: '#1a3e7a', fontWeight: 700, background: '#fff', borderRadius: 16, padding: '6px 28px', border: 'none', boxShadow: '0 2px 8px #0001' }}>Home Screen</Button>
                <Button variant="primary" style={{ color: '#fff', fontWeight: 700, background: 'linear-gradient(90deg,#1a3e7a,#2d6be6)', borderRadius: 16, padding: '6px 28px', border: 'none', boxShadow: '0 2px 8px #2d6be633' }}>Converter</Button>
                <Button variant="light" style={{ color: '#1a3e7a', fontWeight: 700, background: '#fff', borderRadius: 16, padding: '6px 28px', border: 'none', boxShadow: '0 2px 8px #0001' }}>Robot Status</Button>
              </div>
            </Col>
            <Col xs="auto">
              <Button variant="light" style={{ borderRadius: 16, background: '#fff', border: 'none', boxShadow: '0 2px 8px #0001', marginRight: 8 }}><i className="bi bi-gear"></i></Button>
              <Button variant="light" style={{ borderRadius: 16, background: '#fff', border: 'none', boxShadow: '0 2px 8px #0001' }}><i className="bi bi-bell"></i></Button>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Saludo */}
      <Container fluid style={{ marginTop: 32 }}>
        <Row>
          <Col xs={12}>
            <h2 style={{ color: '#1a3e7a', fontWeight: 900, marginBottom: 0, fontFamily: 'Montserrat, Inter, Segoe UI, Arial, sans-serif', letterSpacing: 1.5 }}>
              <span style={{ color: '#0066cc', fontWeight: 900 }}>GOOD DAY</span><span style={{ color: '#1a3e7a', fontWeight: 700 }}>, Admin!</span>
            </h2>
          </Col>
        </Row>

        {/* Layout principal: tabla izq, convertidor der */}
        <Row className="mt-4" style={{ minHeight: 480 }}>
          {/* Tabla de parámetros a la izquierda */}
          <Col md={4} lg={3}>
            <div style={{
              background: '#fff',
              borderRadius: 22,
              boxShadow: '0 4px 24px #1a3e7a22',
              padding: 24,
              marginBottom: 24,
              border: '2px solid #e0e3ea',
              minHeight: 380
            }}>
              <div style={{ color: '#1a3e7a', fontWeight: 800, fontSize: 20, marginBottom: 12, letterSpacing: 1 }}>PARAMETERS</div>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                <Table bordered size="sm" style={{ fontSize: '1em', color: '#1a3e7a', background: '#f3f4f8', borderRadius: 12 }}>
                  <thead>
                    <tr>
                      {tablaHeaders.map(h => <th key={h} style={{ background: '#e0e3ea', color: '#1a3e7a', fontWeight: 700 }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {tabla.map((row, i) => (
                      <tr key={i} style={{ cursor: 'pointer', background: selectedRow === row ? '#b3d1ff' : 'transparent' }} onClick={() => handleRowSelect(row)}>
                        {tablaHeaders.map(h => (
                          <td key={h}>{row[h]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>
          </Col>

          {/* Convertidor a la derecha, cuadro azul */}
          <Col md={8} lg={5} className="offset-lg-1">
            <div style={{
              background: '#1565c0',
              borderRadius: 22,
              boxShadow: '0 8px 32px #1a3e7a33',
              padding: 32,
              minWidth: 340,
              maxWidth: 420,
              margin: '0 auto',
              color: '#fff',
              position: 'relative',
              marginBottom: 24
            }}>
              <div style={{
                position: 'absolute',
                top: -32,
                right: 24,
                fontWeight: 900,
                fontSize: 28,
                color: '#1a3e7a',
                textShadow: '2px 2px 0 #00cfff, 0 2px 8px #fff',
                letterSpacing: 2
              }}>.DXF FILE</div>
              <Form onSubmit={handleConvert} className="mt-4">
                <Form.Group className="mb-3">
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Form.Label style={{ fontWeight: 700, color: '#fff', marginRight: 8, marginBottom: 0 }}>SELECT FILE</Form.Label>
                    <div style={{ flex: 1, background: '#fff', color: '#1565c0', borderRadius: 12, padding: '4px 12px', fontWeight: 700, minWidth: 120, textAlign: 'center' }}>
                      {file ? file.name : 'Ningún archivo seleccionado'}
                    </div>
                  </div>
                  <Form.Control type="file" accept=".dxf" onChange={e => setFile(e.target.files[0])} ref={fileInputRef} style={{ background: '#fff', color: '#1565c0', border: 'none', borderRadius: 12, marginTop: 8 }} />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label style={{ color: '#fff', fontWeight: 700 }}>MATERIAL:</Form.Label>
                  <Form.Control name="Material" value={form['Material']} onChange={handleFormChange} style={{ background: '#fff', color: '#1565c0', border: 'none', borderRadius: 12, fontWeight: 700, marginBottom: 12 }} />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Control name="Corriente (A)" value={form['Corriente (A)']} onChange={handleFormChange} placeholder="Corriente (A)" style={{ background: '#fff', color: '#1565c0', border: 'none', borderRadius: 12, fontWeight: 700, marginBottom: 12 }} />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Control name="Espesor (mm)" value={form['Espesor (mm)']} onChange={handleFormChange} placeholder="Espesor (mm)" style={{ background: '#fff', color: '#1565c0', border: 'none', borderRadius: 12, fontWeight: 700, marginBottom: 12 }} />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Control name="Velocidad corte (mm/s)" value={form['Velocidad corte (mm/s)']} onChange={handleFormChange} placeholder="Velocidad corte (mm/s)" style={{ background: '#fff', color: '#1565c0', border: 'none', borderRadius: 12, fontWeight: 700, marginBottom: 12 }} />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Control name="Velocidad J" value={form['Velocidad J']} onChange={handleFormChange} placeholder="Velocidad J" style={{ background: '#fff', color: '#1565c0', border: 'none', borderRadius: 12, fontWeight: 700, marginBottom: 12 }} />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Control name="Z" value={form['Z']} onChange={handleFormChange} placeholder="Z (altura corte)" style={{ background: '#fff', color: '#1565c0', border: 'none', borderRadius: 12, fontWeight: 700, marginBottom: 12 }} />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Control name="User Frame" value={form['User Frame']} onChange={handleFormChange} placeholder="User Frame" style={{ background: '#fff', color: '#1565c0', border: 'none', borderRadius: 12, fontWeight: 700, marginBottom: 12 }} />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Control name="Tool" value={form['Tool']} onChange={handleFormChange} placeholder="Tool" style={{ background: '#fff', color: '#1565c0', border: 'none', borderRadius: 12, fontWeight: 700, marginBottom: 12 }} />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Control name="Plasma" value={form['Plasma']} onChange={handleFormChange} placeholder="Plasma" style={{ background: '#fff', color: '#1565c0', border: 'none', borderRadius: 12, fontWeight: 700, marginBottom: 12 }} />
                </Form.Group>
                {convertError && <Alert variant="danger" className="mt-2">{convertError}</Alert>}
                <Button type="submit" variant="primary" className="w-100 mt-2" style={{ fontWeight: 900, color: '#fff', background: 'linear-gradient(90deg,#1a3e7a,#2d6be6)', borderRadius: 12, border: 'none', boxShadow: '0 2px 8px #2d6be633', fontSize: 18 }}>Convertir y descargar JBI</Button>
                {downloadUrl && (
                  <a href={downloadUrl} download="programa.jbi" className="btn btn-primary w-100 mt-2" style={{ fontWeight: 900, color: '#fff', background: 'linear-gradient(90deg,#1a3e7a,#2d6be6)', borderRadius: 12, border: 'none', boxShadow: '0 2px 8px #2d6be633', fontSize: 18 }}>Descargar archivo .JBI</a>
                )}
              </Form>
            </div>

            {/* Gestión de archivos JBI debajo del convertidor */}
            <div style={{
              background: '#fff',
              borderRadius: 18,
              boxShadow: '0 4px 24px #1a3e7a22',
              padding: 24,
              marginTop: 32,
              color: '#1a3e7a',
              border: '2px solid #e0e3ea',
              minHeight: 180
            }}>
              <div style={{ color: '#1565c0', fontWeight: 800, fontSize: 20, marginBottom: 12, letterSpacing: 1 }}>ARCHIVOS JBI EN EL ROBOT</div>
              <div style={{ display: 'flex', marginBottom: 12 }}>
                <input
                  type="text"
                  placeholder="Buscar archivo..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    flex: 1,
                    borderRadius: 12,
                    border: '1.5px solid #b3d1ff',
                    padding: '4px 12px',
                    fontWeight: 600,
                    color: '#1565c0',
                    background: '#f3f4f8',
                    marginRight: 8
                  }}
                />
              </div>
              <div style={{ maxHeight: 160, overflowY: 'auto' }}>
                {jobsLoading ? <Spinner animation="border" /> : (
                  <Table bordered size="sm" style={{ fontSize: '0.98em', color: '#1565c0', background: '#f3f4f8', borderRadius: 12 }}>
                    <thead>
                      <tr>
                        <th style={{ background: '#e0e3ea', color: '#1565c0', fontWeight: 700 }}>#</th>
                        <th style={{ background: '#e0e3ea', color: '#1565c0', fontWeight: 700 }}>Archivo</th>
                        <th style={{ background: '#e0e3ea', color: '#1565c0', fontWeight: 700 }}>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.filter(j => j.toLowerCase().includes(search.toLowerCase())).map((j, i) => (
                        <tr key={j} style={{ background: i % 2 === 0 ? '#e3f0ff' : 'transparent' }}>
                          <td>{i + 1}</td>
                          <td>{j}</td>
                          <td>
                            <Button variant="outline-danger" size="sm" style={{ borderRadius: 8, fontWeight: 600, border: '1.5px solid #e53935', color: '#e53935', background: 'rgba(229,57,53,0.08)' }} disabled={deleteLoading === i} onClick={() => handleDelete(i)}>
                              {deleteLoading === i ? <Spinner size="sm" animation="border" /> : 'Eliminar'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
                {jobsError && <Alert variant="danger">{jobsError}</Alert>}
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default ModernDashboard;
