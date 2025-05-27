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
    <div style={{
      minHeight: '100vh',
      background: '#000',
      padding: '0',
      fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
    }}>
      <Container fluid className="py-4 px-2 px-md-5">
        <Row className="g-4 align-items-stretch">
          {/* Panel de conversión a la izquierda */}
          <Col lg={5} md={6} sm={12}>
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

          {/* Panel de parámetros a la derecha */}
          <Col lg={7} md={6} sm={12}>
            <Card className="shadow-lg border-0 h-100" style={{background: '#111', borderRadius: 18}}>
              <Card.Body>
                <div className="d-flex align-items-center mb-3">
                  <h3 className="mb-0 text-light" style={{fontWeight: 700, letterSpacing: 1}}>Parámetros de corte</h3>
                  <Badge bg="info" className="ms-3" style={{fontSize: '1em'}}>Materiales</Badge>
                </div>
                <div style={{ maxHeight: 400, overflowY: 'auto', borderRadius: 12, border: '1px solid #222', boxShadow: '0 2px 16px 0 #0002', background: '#000', position: 'relative' }}>
                  <Table hover responsive bordered className="mb-0 sticky-table" style={{color:'#4fc3f7', fontSize:'1.01em', background:'#000', borderCollapse:'separate', borderSpacing:0}}>
                    <thead className="sticky-thead">
                      <tr>
                        {tablaHeaders.map(h => <th key={h} style={{position:'sticky', top:0, background:'#111', color:'#aeeaff', zIndex:20, borderBottom:'2px solid #222'}}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {tabla.map((row, i) => {
                        const isSelected = selectedRow === row;
                        return (
                          <tr
                            key={i}
                            className={
                              isSelected ? 'row-selected' : ''
                            }
                            style={{
                              cursor: 'pointer',
                              // Elimina background inline para que el CSS de selección y hover funcione en toda la fila
                            }}
                            onClick={() => handleRowSelect(row)}
                            onMouseEnter={e => e.currentTarget.classList.add('row-hover')}
                            onMouseLeave={e => e.currentTarget.classList.remove('row-hover')}
                          >
                            {tablaHeaders.map(h => (
                              <td
                                key={h}
                                style={{
                                  verticalAlign: 'middle',
                                  background: 'transparent', // Deja que el <tr> pinte el fondo
                                  color: '#4fc3f7',
                                  border: '1px solid #333'
                                }}
                              >
                                {row[h]}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
                <div className="text-end mt-2" style={{fontSize:'0.95em', color:'#aeeaff'}}>
                  Haz click en una fila para autollenar el formulario de conversión
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Panel de archivos JBI abajo, ocupando todo el ancho */}
        <Row className="mt-4">
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
                <div style={{ maxHeight: 250, overflowY: 'auto', borderRadius: 12, border: '1px solid #222', background: '#000' }}>
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
    </div>
  );
};

export default Converter;