import React, { useEffect, useState, useRef } from 'react';
import { Container, Row, Col, Table, Button, Form, Spinner, InputGroup, Alert, Card, Badge } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Converter.css';

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
        <Container fluid className="py-4 px-2 px-md-5">
          <Button variant="outline-light" className="mb-3" style={{borderRadius:12, fontWeight:600, fontSize:'1.1em', background:'rgba(255,255,255,0.07)', border:'1.5px solid #007bff'}} onClick={() => setView('select')}>
            ← Volver
          </Button>
          <Row className="g-4 align-items-stretch">
            {/* Panel de conversión a la izquierda */}
            <Col lg={6} md={8} sm={12} className="mx-auto">
              <Card className="shadow-lg border-0 h-100" style={{background: '#111', borderRadius: 18}}>
                <Card.Body>
                  <div className="d-flex align-items-center mb-3">
                    <img src="/logo192.png" alt="Yaskawa" style={{height: 48, marginRight: 16}} />
                    <h3 className="mb-0 text-light" style={{fontWeight: 700, letterSpacing: 1}}>Convertir DXF</h3>
                    <Badge bg="primary" className="ms-3" style={{fontSize: '1em'}}>Conversión</Badge>
                  </div>
                  <Form onSubmit={handleConvert} className="p-2">
                    <Form.Group className="mb-3">
                      <Form.Label className="text-light">Archivo DXF</Form.Label>
                      <Form.Control type="file" accept=".dxf" onChange={e => setFile(e.target.files[0])} ref={fileInputRef} style={{background:'#000', color:'#fff', border:'1px solid #333', borderRadius:8}} />
                    </Form.Group>
                    <Row>
                      <Col xs={12} md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label className="text-light">Material</Form.Label>
                          <Form.Control name="Material" value={form['Material']} onChange={handleFormChange} style={{background:'#000', color:'#fff', border:'1px solid #333', borderRadius:8}} />
                        </Form.Group>
                        <Form.Group className="mb-2">
                          <Form.Label className="text-light">Corriente (A)</Form.Label>
                          <Form.Control name="Corriente (A)" value={form['Corriente (A)']} onChange={handleFormChange} style={{background:'#000', color:'#fff', border:'1px solid #333', borderRadius:8}} />
                        </Form.Group>
                        <Form.Group className="mb-2">
                          <Form.Label className="text-light">Espesor (mm)</Form.Label>
                          <Form.Control name="Espesor (mm)" value={form['Espesor (mm)']} onChange={handleFormChange} style={{background:'#000', color:'#fff', border:'1px solid #333', borderRadius:8}} />
                        </Form.Group>
                        <Form.Group className="mb-2">
                          <Form.Label className="text-light">Velocidad corte (mm/s)</Form.Label>
                          <Form.Control name="Velocidad corte (mm/s)" value={form['Velocidad corte (mm/s)']} onChange={handleFormChange} style={{background:'#000', color:'#fff', border:'1px solid #333', borderRadius:8}} />
                        </Form.Group>
                      </Col>
                      <Col xs={12} md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label className="text-light">Velocidad J</Form.Label>
                          <Form.Control name="Velocidad J" value={form['Velocidad J']} onChange={handleFormChange} style={{background:'#000', color:'#fff', border:'1px solid #333', borderRadius:8}} />
                        </Form.Group>
                        <Form.Group className="mb-2">
                          <Form.Label className="text-light">Z (altura corte)</Form.Label>
                          <Form.Control name="Z" value={form['Z']} onChange={handleFormChange} style={{background:'#000', color:'#fff', border:'1px solid #333', borderRadius:8}} />
                        </Form.Group>
                        <Form.Group className="mb-2">
                          <Form.Label className="text-light">User Frame</Form.Label>
                          <Form.Control name="User Frame" value={form['User Frame']} onChange={handleFormChange} style={{background:'#000', color:'#fff', border:'1px solid #333', borderRadius:8}} />
                        </Form.Group>
                        <Form.Group className="mb-2">
                          <Form.Label className="text-light">Tool</Form.Label>
                          <Form.Control name="Tool" value={form['Tool']} onChange={handleFormChange} style={{background:'#000', color:'#fff', border:'1px solid #333', borderRadius:8}} />
                        </Form.Group>
                        <Form.Group className="mb-2">
                          <Form.Label className="text-light">Plasma</Form.Label>
                          <Form.Control name="Plasma" value={form['Plasma']} onChange={handleFormChange} style={{background:'#000', color:'#fff', border:'1px solid #333', borderRadius:8}} />
                        </Form.Group>
                      </Col>
                    </Row>
                    {convertError && <Alert variant="danger" className="mt-2">{convertError}</Alert>}
                    <Button type="submit" variant="success" className="w-100 mt-3" style={{fontWeight:600, fontSize:'1.1em', borderRadius:8}} disabled={convertLoading}>
                      {convertLoading ? <Spinner size="sm" animation="border" /> : 'Convertir y descargar JBI'}
                    </Button>
                    {downloadUrl && (
                      <a href={downloadUrl} download="programa.jbi" className="btn btn-success w-100 mt-2" style={{fontWeight:600, fontSize:'1.1em', borderRadius:8}}>Descargar archivo .JBI</a>
                    )}
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      )}
      {/* FILES VIEW: solo gestor de archivos */}
      {view === 'files' && (
        <Container fluid className="py-4 px-2 px-md-5">
          <Button variant="outline-light" className="mb-3" style={{borderRadius:12, fontWeight:600, fontSize:'1.1em', background:'rgba(255,255,255,0.07)', border:'1.5px solid #007bff'}} onClick={() => setView('select')}>
            ← Volver
          </Button>
          <Row className="g-4 align-items-stretch">
            <Col md={12}>
              <Card className="shadow-lg border-0" style={{background: '#111', borderRadius: 18}}>
                <Card.Body>
                  <div className="d-flex align-items-center mb-2">
                    <h4 className="text-light mb-0" style={{fontWeight:700, letterSpacing:1}}>Archivos JBI en el robot</h4>
                    <Badge bg="secondary" className="ms-3">FTP</Badge>
                  </div>
                  <InputGroup className="mb-2" style={{ maxWidth: 350 }}>
                    <Form.Control placeholder="Buscar archivo..." value={search} onChange={e => setSearch(e.target.value)} style={{background:'#000', color:'#fff', border:'1px solid #333', borderRadius:8}} />
                  </InputGroup>
                  <div style={{ maxHeight: 350, overflowY: 'auto', borderRadius: 12, border: '1px solid #222', background: '#000' }}>
                    {jobsLoading ? <Spinner animation="border" /> : (
                      <Table hover responsive borderless className="mb-0" style={{color:'#4fc3f7', fontSize:'1.01em', background:'#000', borderCollapse:'separate', borderSpacing:0}}>
                        <thead style={{background:'#111'}}>
                          <tr>
                            <th style={{color:'#4fc3f7', fontWeight:600, minWidth:40, background:'#111'}}>#</th>
                            <th style={{color:'#4fc3f7', fontWeight:600, minWidth:180, background:'#111'}}>Archivo</th>
                            <th style={{color:'#4fc3f7', fontWeight:600, minWidth:100, background:'#111'}}>Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {jobs.filter(j => j.toLowerCase().includes(search.toLowerCase())).map((j, i) => (
                            <tr key={j} style={{background: i%2===0?'rgba(51,65,85,0.13)':'rgba(0,0,0,0)'}}>
                              <td style={{color:'#4fc3f7', fontWeight:500, background:'#000', border:'1px solid #333'}}>{i+1}</td>
                              <td style={{color:'#4fc3f7', fontWeight:500, background:'#000', border:'1px solid #333'}}>{j}</td>
                              <td style={{background:'#000', border:'1px solid #333'}}>
                                <Button variant="danger" size="sm" style={{borderRadius:8, fontWeight:600}} disabled={deleteLoading===i} onClick={() => handleDelete(i)}>
                                  {deleteLoading===i ? <Spinner size="sm" animation="border" /> : 'Eliminar'}
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