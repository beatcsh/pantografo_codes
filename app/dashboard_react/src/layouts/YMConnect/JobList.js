import { Container, Table, Button, Row, Col, Badge } from "react-bootstrap"
import { FaDownload, FaPlay, FaStop, FaEye } from "react-icons/fa"
import withReactContent from 'sweetalert2-react-content'
import InfoButton from "../../components/InfoButton"
import { IoMdRefresh } from "react-icons/io"
import InfoModal from "../../components/InfoModal"
import ModalJob from "../../components/ModalJob"
import { GrConfigure } from "react-icons/gr"
import { useState, useEffect } from "react"
import Loader from "../../components/Loader"
import { FaFile } from "react-icons/fa"

import Swal from "sweetalert2"
import axios from "axios"
import "aos/dist/aos.css"

import AOS from "aos"
import 'aos/dist/aos.css'

const MySwal = withReactContent(Swal)
const ymConnectService = "http://localhost:5229"

const JobList = ({ robot_ip }) => {
  const [currentJob, setCurrentJob] = useState("No file selected")
  const [jobs, setJobs] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [modalContent, setModalContent] = useState("")

  const info = `
ℹ️ Job Management Screen - User Guide

In this screen, you can view all the jobs currently loaded in the system. Several actions are available for job management, described below:

🔧 Set Active Job: Use the wrench icon to configure the currently active job in the system.
👁️ Preview File: Click the eye icon to view the contents of the file. This allows you to understand its structure before execution.
📥 Download File: Use the download icon to export the job in .JBI format.

At the top section of the screen, the job that is currently active on the robot is clearly indicated. You are also provided with options to:

▶️ Start Job Execution  
⏹️ Stop Job Execution

⚠️ Warning: Use the execution and stop controls with caution. Ensure all safety protocols are followed before interacting with the robot.
`
  const fetchJobs = async () => {
    try {

      AOS.init()
      const res = await axios.get(`${ymConnectService}/Jobs/jobList`, { params: { robot_ip: robot_ip } })
      setJobs(res.data)

    } catch (error) {
      MySwal.fire({
        icon: "error",
        title: "Conexión perdida.",
        timer: 2000,
        showConfirmButton: false
      });
    }
  };
  useEffect(() => {
    fetchJobs();
  }, []);

  const setJob = async (file) => {
    try {
      const selected = file.includes('.')
        ? file.substring(0, file.lastIndexOf('.'))
        : file

      const res = await axios.get(`${ymConnectService}/Process/setJob`, { params: { nombre: selected, robot_ip: robot_ip } })
      setCurrentJob(file)

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
      const ioCheckUrl = `${ymConnectService}/IoInterface/readSpecificIO`;
      const jobStartUrl = `${ymConnectService}/Process/startJob`;

      const { data: ioData } = await axios.get(ioCheckUrl, { params: { code: 80026, robot_ip: robot_ip } });

      if (!ioData) {
        return MySwal.fire({
          icon: "error",
          title: "El robot se encuentra en paro por una emergencia.",
          timer: 10000,
          showConfirmButton: false
        });
      }

      const { data: jobRes } = await axios.get(jobStartUrl, { params: { robot_ip: robot_ip } });

      if (jobRes?.statusCode === 0) {
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
      const reqUrl = `${ymConnectService}/Process/stopJob`
      const res = await axios.get(reqUrl, { params: { robot_ip: robot_ip } })
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
      // const reqUrl = `${ymConnectService}/Jobs/getStringJob/${job}`
      const res = await axios.get(`${ymConnectService}/Jobs/getStringJob`, { params: { nombre: job, robot_ip: robot_ip } })

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
      const reqUrl = `${ymConnectService}/Jobs/getStringJob`;
      const res = await axios.get(reqUrl, { params: { nombre: job, robot_ip: robot_ip } });
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
        timer: 2000,
        showConfirmButton: false
      });
    }
  };

  const handleShowInfo = () => {
    setShowInfoModal(true)
  }

  return (
    <>
      <Container data-aos="zoom-in" fluid >
        {/* Título y contador */}
        <Row className="mb-4 mt-5 justify-content-center">
          <Col xs={12} md={10} lg={8}>
            <h1 style={{ color: "white", marginTop: '30px' }}><FaFile className="mb-2" /> Job List</h1>
            <Badge bg="secondary">{jobs.length - 1} jobs found</Badge>
            <hr />
          </Col>
        </Row>
        {/* Tabla de trabajos */}
        <Row className="justify-content-center">
          <Col xs={12} md={10} lg={8}>
            <div style={{ marginBottom: '25px' }}>
              <Button variant="success" className="m-2 pr-1" onClick={startJob}><FaPlay /> Play</Button>
              <Button variant="danger" className="m-2 pr-1" onClick={stopJob}><FaStop /> Stop</Button>
              <Button variant="primary" className="m-2 pr-1"><FaFile /> {currentJob}</Button>
              <Button variant="warning" className="m-2 pr-1" onClick={fetchJobs}><IoMdRefresh /> Refresh</Button>
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
                  {Array.isArray(jobs) && jobs.length > 0 ? (
                    jobs.map((job, index) =>
                      index < jobs.length - 1 ? (
                        <tr key={index}>
                          <td>
                            <span>{job}</span>
                          </td>
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
                    )
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center text-muted align-middle">
                        <div className="d-flex flex-column align-items-center justify-content-center mt-2">
                          <p className="mb-3 mt-3">No data available</p>
                          <Loader />
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </Col>
        </Row>
        <ModalJob show={showModal} close={() => setShowModal(false)} content={modalContent} />
        <InfoModal show={showInfoModal} close={() => setShowInfoModal(false)} content={info} />
      </Container>
      <InfoButton onClick={handleShowInfo} />
    </>
  );
};

export default JobList;