import React, { useEffect, useState, useRef } from 'react';
import { Container, Row, Col, Table, Button, Form, Spinner, InputGroup, Alert, Card, Badge } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../App.css';

// Usa la misma API que Converter.js
const API_URL = 'http://localhost:8000';

const ModernDashboard = () => {
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
    <div style={{ minHeight: '100vh', background: '#f6f8fb', padding: 0, fontFamily: 'Inter, Segoe UI, Arial, sans-serif' }}>
      {/* Header superior */}
      <div style={{ background: '#fff', padding: '24px 0 0 0', borderBottom: '1px solid #e3e8f0', boxShadow: '0 2px 8px 0 #0001' }}>
        <Container fluid>
          <Row className="align-items-center">
            <Col xs="auto">
              <img src="/logo192.png" alt="Logo" style={{ height: 48, borderRadius: 12, background: '#e3e8f0', padding: 4 }} />
            </Col>
            <Col>
              <div style={{ display: 'flex', gap: 16 }}>
                <Button variant="link" style={{ color: '#2563eb', fontWeight: 700, background: '#e8f0fe', borderRadius: 20, padding: '6px 24px' }}>Dashboard</Button>
                <Button variant="link" style={{ color: '#64748b', fontWeight: 600, background: 'none' }}>Convertidor</Button>
                <Button variant="link" style={{ color: '#64748b', fontWeight: 600, background: 'none' }}>Archivos</Button>
                <Button variant="link" style={{ color: '#64748b', fontWeight: 600, background: 'none' }}>Reportes</Button>
              </div>
            </Col>
            <Col xs="auto">
              <Button variant="primary" style={{ borderRadius: 20, fontWeight: 600, padding: '8px 24px', background: '#2563eb', border: 'none' }}>+ Nuevo</Button>
            </Col>
            <Col xs="auto">
              <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="User" style={{ height: 40, width: 40, borderRadius: '50%' }} />
            </Col>
          </Row>
        </Container>
      </div>

      {/* Saludo y acciones */}
      <Container fluid style={{ marginTop: 32 }}>
        <Row className="align-items-center mb-4">
          <Col md={8}>
            <h2 style={{ color: '#2563eb', fontWeight: 700, marginBottom: 0 }}>¡Hola, Operador!</h2>
            <div style={{ color: '#64748b', fontSize: 18 }}>Panel de control del convertidor y gestión de archivos JBI</div>
          </Col>
          <Col md={4} className="text-end">
            <Button variant="outline-primary" style={{ borderRadius: 20, fontWeight: 600, marginRight: 12 }}>Filtrar</Button>
            <Button variant="outline-primary" style={{ borderRadius: 20, fontWeight: 600, marginRight: 12 }}>Descargar datos</Button>
            <Button variant="outline-secondary" style={{ borderRadius: 20, fontWeight: 600 }}>Cambiar vista</Button>
          </Col>
        </Row>

        {/* Tarjetas principales */}
        <Row className="g-4 mb-4">
          <Col md={4}>
            <Card style={{ borderRadius: 18, boxShadow: '0 2px 12px 0 #2563eb11', border: 'none', background: '#fff' }}>
              <Card.Body>
                <div style={{ color: '#64748b', fontWeight: 600 }}>Parámetros de corte</div>
                <div style={{ maxHeight: 180, overflowY: 'auto', marginTop: 8 }}>
                  <Table bordered size="sm" style={{ fontSize: '0.98em', color: '#2563eb', background: '#f8fafc', borderRadius: 12 }}>
                    <thead>
                      <tr>
                        {tablaHeaders.map(h => <th key={h} style={{ background: '#e8f0fe', color: '#2563eb', fontWeight: 700 }}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {tabla.map((row, i) => (
                        <tr key={i} style={{ cursor: 'pointer', background: selectedRow === row ? '#dbeafe' : 'transparent' }} onClick={() => handleRowSelect(row)}>
                          {tablaHeaders.map(h => (
                            <td key={h}>{row[h]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card style={{ borderRadius: 18, boxShadow: '0 2px 12px 0 #2563eb11', border: 'none', background: '#2563eb', color: '#fff' }}>
              <Card.Body>
                <div style={{ fontWeight: 700, fontSize: 18 }}>Conversión DXF → JBI</div>
                <Form onSubmit={handleConvert} className="mt-3">
                  <Form.Group className="mb-2">
                    <Form.Label>Archivo DXF</Form.Label>
                    <Form.Control type="file" accept=".dxf" onChange={e => setFile(e.target.files[0])} ref={fileInputRef} style={{ background: '#fff', color: '#2563eb', border: '1px solid #93c5fd', borderRadius: 8 }} />
                  </Form.Group>
                  <Row>
                    <Col xs={6}>
                      <Form.Group className="mb-2">
                        <Form.Label>Material</Form.Label>
                        <Form.Control name="Material" value={form['Material']} onChange={handleFormChange} style={{ background: '#fff', color: '#2563eb', border: '1px solid #93c5fd', borderRadius: 8 }} />
                      </Form.Group>
                      <Form.Group className="mb-2">
                        <Form.Label>Corriente (A)</Form.Label>
                        <Form.Control name="Corriente (A)" value={form['Corriente (A)']} onChange={handleFormChange} style={{ background: '#fff', color: '#2563eb', border: '1px solid #93c5fd', borderRadius: 8 }} />
                      </Form.Group>
                      <Form.Group className="mb-2">
                        <Form.Label>Espesor (mm)</Form.Label>
                        <Form.Control name="Espesor (mm)" value={form['Espesor (mm)']} onChange={handleFormChange} style={{ background: '#fff', color: '#2563eb', border: '1px solid #93c5fd', borderRadius: 8 }} />
                      </Form.Group>
                      <Form.Group className="mb-2">
                        <Form.Label>Velocidad corte (mm/s)</Form.Label>
                        <Form.Control name="Velocidad corte (mm/s)" value={form['Velocidad corte (mm/s)']} onChange={handleFormChange} style={{ background: '#fff', color: '#2563eb', border: '1px solid #93c5fd', borderRadius: 8 }} />
                      </Form.Group>
                    </Col>
                    <Col xs={6}>
                      <Form.Group className="mb-2">
                        <Form.Label>Velocidad J</Form.Label>
                        <Form.Control name="Velocidad J" value={form['Velocidad J']} onChange={handleFormChange} style={{ background: '#fff', color: '#2563eb', border: '1px solid #93c5fd', borderRadius: 8 }} />
                      </Form.Group>
                      <Form.Group className="mb-2">
                        <Form.Label>Z (altura corte)</Form.Label>
                        <Form.Control name="Z" value={form['Z']} onChange={handleFormChange} style={{ background: '#fff', color: '#2563eb', border: '1px solid #93c5fd', borderRadius: 8 }} />
                      </Form.Group>
                      <Form.Group className="mb-2">
                        <Form.Label>User Frame</Form.Label>
                        <Form.Control name="User Frame" value={form['User Frame']} onChange={handleFormChange} style={{ background: '#fff', color: '#2563eb', border: '1px solid #93c5fd', borderRadius: 8 }} />
                      </Form.Group>
                      <Form.Group className="mb-2">
                        <Form.Label>Tool</Form.Label>
                        <Form.Control name="Tool" value={form['Tool']} onChange={handleFormChange} style={{ background: '#fff', color: '#2563eb', border: '1px solid #93c5fd', borderRadius: 8 }} />
                      </Form.Group>
                      <Form.Group className="mb-2">
                        <Form.Label>Plasma</Form.Label>
                        <Form.Control name="Plasma" value={form['Plasma']} onChange={handleFormChange} style={{ background: '#fff', color: '#2563eb', border: '1px solid #93c5fd', borderRadius: 8 }} />
                      </Form.Group>
                    </Col>
                  </Row>
                  {convertError && <Alert variant="danger" className="mt-2">{convertError}</Alert>}
                  <Button type="submit" variant="light" className="w-100 mt-2" style={{ fontWeight: 700, color: '#2563eb', borderRadius: 8 }}>Convertir y descargar JBI</Button>
                  {downloadUrl && (
                    <a href={downloadUrl} download="programa.jbi" className="btn btn-light w-100 mt-2" style={{ fontWeight: 700, color: '#2563eb', borderRadius: 8 }}>Descargar archivo .JBI</a>
                  )}
                </Form>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card style={{ borderRadius: 18, boxShadow: '0 2px 12px 0 #2563eb11', border: 'none', background: '#fff' }}>
              <Card.Body>
                <div style={{ color: '#64748b', fontWeight: 600 }}>Archivos JBI en el robot</div>
                <InputGroup className="mb-2 mt-2">
                  <Form.Control placeholder="Buscar archivo..." value={search} onChange={e => setSearch(e.target.value)} style={{ background: '#f8fafc', color: '#2563eb', border: '1px solid #93c5fd', borderRadius: 8 }} />
                </InputGroup>
                <div style={{ maxHeight: 120, overflowY: 'auto', marginTop: 8 }}>
                  {jobsLoading ? <Spinner animation="border" /> : (
                    <Table bordered size="sm" style={{ fontSize: '0.98em', color: '#2563eb', background: '#f8fafc', borderRadius: 12 }}>
                      <thead>
                        <tr>
                          <th style={{ background: '#e8f0fe', color: '#2563eb', fontWeight: 700 }}>#</th>
                          <th style={{ background: '#e8f0fe', color: '#2563eb', fontWeight: 700 }}>Archivo</th>
                          <th style={{ background: '#e8f0fe', color: '#2563eb', fontWeight: 700 }}>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {jobs.filter(j => j.toLowerCase().includes(search.toLowerCase())).map((j, i) => (
                          <tr key={j} style={{ background: i % 2 === 0 ? '#f1f5f9' : 'transparent' }}>
                            <td>{i + 1}</td>
                            <td>{j}</td>
                            <td>
                              <Button variant="outline-danger" size="sm" style={{ borderRadius: 8, fontWeight: 600 }} disabled={deleteLoading === i} onClick={() => handleDelete(i)}>
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
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default ModernDashboard;
