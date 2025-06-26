import { Container, Spinner, Table, Row, Col, Badge, Button } from "react-bootstrap"
import withReactContent from "sweetalert2-react-content"
import GraphsModal from "../../components/GraphsModal"
import InfoButton from "../../components/InfoButton"
import InfoModal from "../../components/InfoModal"
import { MdAutoGraph } from "react-icons/md"
import { useState, useEffect } from "react"
import { CiWarning } from "react-icons/ci"
import { FaFileCsv } from "react-icons/fa"
import { FaBell } from "react-icons/fa"
import Swal from "sweetalert2"
import axios from "axios"
import "aos/dist/aos.css"
import AOS from "aos"


const MySwal = withReactContent(Swal)
const ymConnectService = "http://localhost:5229"
const graphsService = "http://127.0.0.1:8000/graphs"

const Alarms = ({ robot_ip }) => {
  const [almHistory, setAlmHistory] = useState([])
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [showGraphs, setShowGraphs] = useState(false)
  const [data, setData] = useState([])

  const info = `
ℹ️ Alarm History Screen - User Guide

This screen provides a clear overview of the robot's complete alarm history. Each entry includes:

🆔 Alarm Code and Location – Essential for troubleshooting and identifying issues.  
🎮 Robot Mode – Indicates whether the robot was in Play, Remote, or Teach mode when the alarm occurred.  
📝 Alarm Description – The message reported by the system.  
📅 Timestamp – Date and time when the alarm was triggered.

📤 At the bottom of the screen, you can download the entire alarm history as a CSV file for your records and you can view a real
time dashboard clicking on the button of 📊 Graphs, there you can view the analyze of different variables based on alarms behavior.

📂 Note: This information is retrieved directly from the robot's \`ALMHIST.dat\` file.
`;

  const handleShowInfo = () => {
    setShowInfoModal(true)
  }

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        AOS.init()
        const res = await axios.get(`${ymConnectService}/Alarms/getAlarmsHistory`, { params: { robot_ip: robot_ip } })
        parseAlarmHistory(res.data)
        MySwal.fire({
          icon: "success",
          title: "Historial traido con exito",
          timer: 2000,
          showConfirmButton: false
        })
      } catch (error) {
        MySwal.fire({
          icon: "error",
          title: "Conexión perdida.",
          text: error.message,
          timer: 10000,
          showConfirmButton: false
        })
      }
    }

    fetchHistory()
  }, [])

  const parseAlarmHistory = (data) => {
    const lines = data.split("\n").map(l => l.trim()).filter(l => l.length > 0)
    const alarmEntries = []
    let i = 0

    while (i < lines.length) {
      const line = lines[i]
      if (/^\d{4},/.test(line)) {
        const [code, description, , location, , mode] = line.split(",")
        if (i + 9 < lines.length) {
          i += 9
          const timestamp = lines[i]?.trim() || "Sin fecha"
          alarmEntries.push({
            code,
            description,
            location: location?.replace(/\[|\]/g, '').trim() || null,
            mode: mode?.replace(",", "").trim() || null,
            timestamp
          })
        }
      }
      i++
    }

    setAlmHistory(alarmEntries)
  }

  const createCSV = (alarms) => {
    const header = 'N°,Code,Description,Location,Mode,Datetime\n';
    const rows = alarms.map((a, i) =>
      `${i + 1},"${a.code}","${a.description}","${a.location}","${a.mode}","${a.timestamp}"`
    ).join('\n');

    const content = header + rows;

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });

    return blob
  }

  const alarmsCSV = (alarms, file_name = "alarms_history.csv") => {
    const blob = createCSV(alarms)
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link)
  }

  const graphsView = async (alarms) => {
    try {
      const blob = createCSV(alarms)

      const formData = new FormData()
      formData.append("file", blob, "alarms.csv")

      const res = await axios.post(graphsService, formData, { headers: { "Content-Type": "multipart/form-data" } })
      setData(res.data)
      setShowGraphs(true)
    } catch (error) {
      MySwal.fire({
        icon: "error",
        title: "Conexión perdida.",
        text: error.message,
        timer: 10000,
        showConfirmButton: false
      })
    }
  }

  return (
    <>
      <Container data-aos="zoom-in" fluid style={{ padding: "1rem" }}>
        <Row className="mb-4 mt-5 justify-content-center">
          <Col xs={12} md={10} lg={8}>
            <h1 style={{ color: "white" }}><FaBell className="mb-2" /> Alarms History</h1>
            <Badge bg="secondary">{almHistory.length} alarms found <CiWarning /></Badge>
            <hr />
          </Col>
        </Row>
        <Row className="justify-content-center">
          <Col xs={12} md={10} lg={8}>
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "1rem",
                padding: "1rem",
                maxHeight: "500px",  // Altura máxima visible
                overflowY: "auto",   // Scroll vertical si se excede
                boxShadow: "0 0 10px rgba(0,0,0,0.1)"
              }}
            >
              <Table responsive borderless className="mb-0">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Description</th>
                    <th>Location</th>
                    <th>Mode</th>
                    <th>Datetime</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(almHistory) && almHistory.length > 0 ? (
                    almHistory.map((alarm, idx) => (
                      <tr key={idx}>
                        <td>{alarm.code}</td>
                        <td>{alarm.description}</td>
                        <td>{alarm.location}</td>
                        <td>{alarm.mode}</td>
                        <td>{alarm.timestamp}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center text-muted">
                        <Spinner animation="border" role="status" className="mt-5">
                          <span className="visually-hidden">Loading...</span>
                        </Spinner>
                        <p>No data available</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
            <Button className="mt-3" variant="success" onClick={() => alarmsCSV(almHistory)}>
              <FaFileCsv /> Download CSV
            </Button>
            <Button className="mt-3" variant="warning" style={{ marginLeft: '15px' }} onClick={() => graphsView(almHistory)}>
              <MdAutoGraph /> Graphs
            </Button>
          </Col>
        </Row>
        <InfoModal show={showInfoModal} close={() => setShowInfoModal(false)} content={info} />
        <GraphsModal show={showGraphs} close={() => setShowGraphs(false)} data={data}/>
      </Container>
      <InfoButton onClick={handleShowInfo} />
    </>
  )
}

export default Alarms