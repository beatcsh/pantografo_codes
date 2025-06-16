import { Container, Table, Button, Row, Col, Card } from "react-bootstrap";
import { FaDownload, FaPlay, FaStop, FaEye } from "react-icons/fa";
import { CiFileOn } from "react-icons/ci";
import withReactContent from 'sweetalert2-react-content';
import { GrConfigure } from "react-icons/gr";
import { useState, useEffect } from "react";
import ModalJob from "../../components/ModalJob";
import Swal from 'sweetalert2';
import axios from 'axios';
import AOS from "aos";
import 'aos/dist/aos.css';

const MySwal = withReactContent(Swal);
const ymConnectService = "http://localhost:5229";

const JobList = () => {
  const [jobs, setJobs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState("");

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        AOS.init();
        const res = await axios.get(`${ymConnectService}/Jobs/jobList`);
        setJobs(res.data);
        MySwal.fire({
          icon: "success",
          title: "Archivos traídos con éxito",
          timer: 1000,
          showConfirmButton: false
        });
      } catch (error) {
        MySwal.fire({
          icon: "error",
          title: "Conexión perdida.",
          timer: 2000,
          showConfirmButton: false
        });
      }
    };
    fetchJobs();
  }, []);

  const setJob = async (file) => {
    try {
      const selected = file.includes('.')
        ? file.substring(0, file.lastIndexOf('.'))
        : file;
      const reqUrl = `${ymConnectService}/Process/setJob/${selected}`;
      const res = await axios.get(reqUrl);
      if (res.data.statusCode === 0) {
        MySwal.fire({
          icon: "success",
          title: "Archivo seleccionado con éxito",
          timer: 1200,
        });
      }
    } catch (error) {
      MySwal.fire({
        icon: "error",
        title: "Conexión perdida.",
        timer: 2000,
        showConfirmButton: false
      });
    }
  };

  const startJob = async () => {
    try {
      const reqUrl = `${ymConnectService}/Process/startJob`;
      const res = await axios.get(reqUrl);
      if (res.data.statusCode === 0) {
        MySwal.fire({
          icon: "success",
          title: "Archivo ejecutado con éxito",
          timer: 1200,
          showConfirmButton: false
        });
      }
    } catch (error) {
      MySwal.fire({
        icon: "error",
        title: "Conexión perdida.",
        timer: 2000,
        showConfirmButton: false
      });
    }
  };

  const stopJob = async () => {
    try {
      const reqUrl = `${ymConnectService}/Process/stopJob`;
      const res = await axios.get(reqUrl);
      if (res.data.statusCode === 0) {
        MySwal.fire({
          icon: "success",
          title: "Archivo detenido",
          timer: 1200,
          showConfirmButton: false
        });
      }
    } catch (error) {
      MySwal.fire({
        icon: "error",
        title: "Conexión perdida.",
        timer: 2000,
        showConfirmButton: false
      });
    }
  };

  const getStringJob = async (job) => {
    try {
      const reqUrl = `${ymConnectService}/Jobs/getStringJob/${job}`;
      const res = await axios.get(reqUrl);
      setModalContent(res.data.content);
      setShowModal(true);
    } catch (error) {
      MySwal.fire({
        icon: "error",
        title: "Conexión perdida.",
        timer: 2000,
        showConfirmButton: false
      });
    }
  };

  return (
    <Container fluid className="py-4" style={{ minHeight: '100vh', background: `url('/assets/FondoHomeYM.png') center center/cover no-repeat fixed` }}>
      <Row className="justify-content-center mb-4">
        <Col xs={12} md={10} lg={8} className="mx-auto d-flex flex-column align-items-center">
          <Card data-aos="zoom-in" style={{ borderRadius: 28, boxShadow: '0 8px 40px #1976d233', background: 'rgba(255,255,255,0.82)', border: 'none', backdropFilter: 'blur(8px)' }}>
            <Card.Body className="d-flex flex-column align-items-center">
              <div style={{ textAlign: 'center', marginBottom: 18, width: '100%' }}>
                <CiFileOn size={38} style={{ color: '#1976d2', marginBottom: -6, marginRight: 10 }} />
                <span style={{ fontWeight: 900, fontSize: 30, color: '#1976d2', letterSpacing: 1, fontFamily: 'Montserrat, Arial, sans-serif' }}>Job List</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 18, marginBottom: 24, width: '100%' }}>
                <Button variant="success" onClick={startJob} className="glow-btn" style={{ fontWeight: 700, borderRadius: 10, fontSize: 18, padding: '10px 32px', minWidth: 120 }}><FaPlay style={{ marginBottom: -2 }} /> Start</Button>
                <Button variant="danger" onClick={stopJob} className="glow-btn" style={{ fontWeight: 700, borderRadius: 10, fontSize: 18, padding: '10px 32px', minWidth: 120 }}><FaStop style={{ marginBottom: -2 }} /> Stop</Button>
              </div>
              <div style={{ width: '100%', maxWidth: 900, margin: '0 auto', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Table responsive borderless style={{ margin: 0, minWidth: 420, background: 'transparent', width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ color: '#1976d2', fontWeight: 800, fontSize: 17, textAlign: 'center', padding: '10px 4px', borderBottom: '2px solid #e3e6f0', background: 'transparent', width: 40 }}>#</th>
                      <th style={{ color: '#1976d2', fontWeight: 800, fontSize: 17, textAlign: 'center', padding: '10px 4px', borderBottom: '2px solid #e3e6f0', background: 'transparent' }}>Job Name</th>
                      <th style={{ color: '#1976d2', fontWeight: 800, fontSize: 17, textAlign: 'center', padding: '10px 4px', borderBottom: '2px solid #e3e6f0', background: 'transparent' }}>Set</th>
                      <th style={{ color: '#1976d2', fontWeight: 800, fontSize: 17, textAlign: 'center', padding: '10px 4px', borderBottom: '2px solid #e3e6f0', background: 'transparent' }}>View</th>
                      <th style={{ color: '#1976d2', fontWeight: 800, fontSize: 17, textAlign: 'center', padding: '10px 4px', borderBottom: '2px solid #e3e6f0', background: 'transparent' }}>Download</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.filter(job => job && typeof job === 'string' && job.trim() !== '').map((job, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #e3e6f0', background: 'transparent', verticalAlign: 'middle' }}>
                        <td style={{ textAlign: 'center', color: '#1976d2', fontWeight: 700, fontSize: 16, padding: '12px 4px', verticalAlign: 'middle' }}>{index + 1}</td>
                        <td style={{ textAlign: 'center', color: '#1976d2', fontWeight: 700, fontSize: 16, padding: '12px 4px', letterSpacing: 0.5, verticalAlign: 'middle' }}>
                          <span style={{ background: 'none', borderRadius: 8, padding: '6px 18px', fontWeight: 700 }}>{job}</span>
                        </td>
                        <td style={{ textAlign: 'center', padding: '12px 4px', verticalAlign: 'middle' }}>
                          <Button onClick={() => setJob(job)} variant="outline-primary" size="sm" className="glow-btn" style={{ borderRadius: 8, fontWeight: 700, minWidth: 36, fontSize: 17, color: '#1976d2', background: 'none', border: '1.5px solid #1976d2', padding: '4px 10px', verticalAlign: 'middle' }} title="Set as active job">
                            <GrConfigure />
                          </Button>
                        </td>
                        <td style={{ textAlign: 'center', padding: '12px 4px', verticalAlign: 'middle' }}>
                          <Button onClick={() => getStringJob(job)} variant="outline-primary" size="sm" className="glow-btn" style={{ borderRadius: 8, fontWeight: 700, minWidth: 36, fontSize: 17, color: '#1976d2', background: 'none', border: '1.5px solid #1976d2', padding: '4px 10px', verticalAlign: 'middle', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="View job content">
                            <FaEye style={{ color: '#e6b800' }} />
                          </Button>
                        </td>
                        <td style={{ textAlign: 'center', padding: '12px 4px', verticalAlign: 'middle' }}>
                          <Button variant="outline-success" size="sm" className="glow-btn" style={{ borderRadius: 8, fontWeight: 700, minWidth: 36, fontSize: 17, color: '#43a047', background: 'none', border: '1.5px solid #43a047', padding: '4px 10px', verticalAlign: 'middle' }} title="Download job" disabled>
                            <FaDownload />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <ModalJob show={showModal} close={() => setShowModal(false)} content={modalContent} />
      <style>{`
    .table td, .table th { vertical-align: middle !important; }
    .table thead th { background: transparent !important; border-bottom: 2px solid #e3e6f0 !important; }
    .table tbody tr { background: transparent !important; }
    .table tbody td { background: transparent !important; border-radius: 0 !important; }
    .table tr:hover { background: #e3edff33 !important; transition: background 0.18s; }
    .btn-warning { color: #fff !important; font-weight: 700; }
    .glow-btn {
      transition: box-shadow 0.18s, filter 0.18s;
      position: relative;
      z-index: 1;
    }
    .glow-btn:hover, .glow-btn:focus {
      box-shadow: 0 0 8px 2px #ffd60055, 0 2px 8px #1976d211;
      filter: brightness(1.08);
    }
    div[style*='overflow-y: auto']::-webkit-scrollbar {
      width: 8px;
    }
    div[style*='overflow-y: auto']::-webkit-scrollbar-thumb {
      background: #e3edff;
      border-radius: 8px;
    }
    div[style*='overflow-y: auto']::-webkit-scrollbar-track {
      background: transparent;
    }
  `}</style>
    </Container>
  );
};

export default JobList;