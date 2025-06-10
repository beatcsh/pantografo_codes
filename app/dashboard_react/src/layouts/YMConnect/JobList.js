import { Container, Table, Button, Row, Col, Badge } from "react-bootstrap"
import { FaDownload, FaPlay, FaStop, FaEye } from "react-icons/fa"
import { CiFileOn } from "react-icons/ci";
import withReactContent from 'sweetalert2-react-content'
import { GrConfigure } from "react-icons/gr"
import { useState, useEffect } from "react"
import ModalJob from "../../components/ModalJob"
import Swal from 'sweetalert2'
import axios from 'axios'
import AOS from "aos"
import 'aos/dist/aos.css'

const MySwal = withReactContent(Swal)
const ymConnectService = "http://localhost:5229"

const JobList = ({ setActive }) => {

  const [jobs, setJobs] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [modalContent, setModalContent] = useState("")

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        AOS.init()
        const res = await axios.get(`${ymConnectService}/Jobs/jobList`)
        setJobs(res.data)
      } catch (error) {
        MySwal.fire({
          icon: "error",
          title: "Conexión perdida.",
          timer: 10000,
          showConfirmButton: false
        })
      }
    }

    fetchJobs()
  }, [])

  const setJob = async (file) => {
    try {
      const selected = file.includes('.')
        ? file.substring(0, file.lastIndexOf('.'))
        : file

      const reqUrl = `${ymConnectService}/Process/setJob/${selected}`
      const res = await axios.get(reqUrl)

      if (res.data.statusCode === 0) {
        MySwal.fire({
          icon: "success",
          title: "Archivo seleccionado con éxito",
          timer: 2000,
          showConfirmButton: false
        })
      }
    } catch (error) {
      MySwal.fire({
        icon: "error",
        title: "Conexión perdida.",
        timer: 10000,
        showConfirmButton: false
      })
    }
  }

  const startJob = async () => {
    try {
      const ioCheckUrl = `${ymConnectService}/Alarms/readSpecificIO/80026`;
      const jobStartUrl = `${ymConnectService}/Process/startJob`;

      const { data: ioData } = await axios.get(ioCheckUrl);

      if (!ioData) {
        return MySwal.fire({
          icon: "error",
          title: "El robot se encuentra en paro por una emergencia.",
          timer: 10000,
          showConfirmButton: false
        });
      }

      const { data: jobRes } = await axios.get(jobStartUrl);

      if (jobRes?.statusCode === 0) {
        MySwal.fire({
          icon: "success",
          title: "Archivo ejecutado con éxito",
          timer: 2000,
          showConfirmButton: false
        });
        // setActive('robotinfo');
      } else {
        MySwal.fire({
          icon: "error",
          title: "Error al ejecutar el archivo.",
          text: jobRes?.message || "Respuesta inesperada del servidor.",
          timer: 8000,
          showConfirmButton: false
        });
      }

    } catch (error) {
      MySwal.fire({
        icon: "error",
        title: "Conexión perdida.",
        text: error?.message || "No se pudo establecer comunicación con el robot.",
        timer: 10000,
        showConfirmButton: false
      });
    }
  };

  const stopJob = async () => {
    try {
      const reqUrl = `${ymConnectService}/Process/stopJob`
      const res = await axios.get(reqUrl)
      if (res.data.statusCode === 0) {
        MySwal.fire({
          icon: "success",
          title: "Archivo detenido",
          timer: 2000,
          showConfirmButton: false
        })
      }
    } catch (error) {
      MySwal.fire({
        icon: "error",
        title: "Conexión perdida.",
        timer: 10000,
        showConfirmButton: false
      })
    }
  }

  const getStringJob = async (job) => {
    try {
      const reqUrl = `${ymConnectService}/Jobs/getStringJob/${job}`
      const res = await axios.get(reqUrl)

      setModalContent(res.data.content)
      setShowModal(true)
    } catch (error) {
      MySwal.fire({
        icon: "error",
        title: "Conexión perdida.",
        timer: 10000,
        showConfirmButton: false
      })
    }
  }

  const downloadJob = async (job) => {
    try {
      const reqUrl = `${ymConnectService}/Jobs/getStringJob/${job}`;
      const res = await axios.get(reqUrl);

      const content = res.data.content;

      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `${job}.JBI`;
      document.body.appendChild(a);
      a.click();

      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      MySwal.fire({
        icon: "error",
        title: "Conexión perdida.",
        timer: 10000,
        showConfirmButton: false
      });
    }
  };


  return (
    <Container data-aos="zoom-in" fluid style={{ minHeight: "100vh", padding: "5rem" }}>
      {/* Título y contador */}
      <Row className="mb-4 mt-5 justify-content-center">
        <Col xs={12} md={10} lg={8}>
          <h1 style={{ color: "white", marginTop: '30px' }}>Job List</h1>
          <Badge bg="secondary">{jobs.length - 1} jobs found <CiFileOn /></Badge>
          <hr />
        </Col>
      </Row>
      {/* Tabla de trabajos */}
      <Row className="justify-content-center">
        <Col xs={12} md={10} lg={8}>
          <div style={{ marginBottom: '25px' }}>
            <Button variant="success" className="m-2 pr-1" onClick={startJob}><FaPlay /> Play</Button>
            <Button variant="danger" className="m-2 pr-1" onClick={stopJob}><FaStop /> Stop</Button>
          </div>
          <div style={{ backgroundColor: "white", borderRadius: "1rem", padding: "2rem" }}>
            <Table responsive borderless style={{ width: '90%' }}>
              <thead>
                <tr>
                  <th><h5>Job name</h5></th>
                  <th><h5>Set</h5></th>
                  <th><h5>Watch</h5></th>
                  <th><h5>Download</h5></th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job, index) => (
                  index < jobs.length - 1 ? (
                    <tr key={index}>
                      <td><h7>{job}</h7></td>
                      <td>
                        <Button onClick={() => setJob(job)} variant="primary" size="sm">
                          <GrConfigure />
                        </Button>
                      </td>
                      <td>
                        <Button onClick={() => getStringJob(job)} variant="warning" size="sm">
                          <FaEye />
                        </Button>
                      </td>
                      <td>
                        <Button onClick={() => downloadJob(job)} variant="dark" size="sm">
                          <FaDownload />
                        </Button>
                      </td>
                    </tr>
                  ) : null
                ))}
                {/*  */}
              </tbody>
            </Table>
          </div>
        </Col>
      </Row>
      <ModalJob show={showModal} close={() => setShowModal(false)} content={modalContent} />
    </Container>
  )
}

export default JobList