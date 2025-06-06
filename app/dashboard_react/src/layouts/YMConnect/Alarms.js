import { Container, Table, Row, Col, Badge, Button } from "react-bootstrap"
import withReactContent from "sweetalert2-react-content"
import { CiWarning } from "react-icons/ci"
import { FaFileCsv } from "react-icons/fa"
import { useState, useEffect } from "react"
import Swal from "sweetalert2"
import axios from "axios"
import AOS from "aos"
import 'aos/dist/aos.css'

const MySwal = withReactContent(Swal)
const ymConnectService = "http://localhost:5229"

const Alarms = () => {
  const [almHistory, setAlmHistory] = useState([])

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        AOS.init()
        const res = await axios.get(`${ymConnectService}/Alarms/getAlarmsHistory`)
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

  function parseAlarmHistory(data) {
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

  const alarmsCSV = (alarms, file_name = "alarms_history.csv") => {
    const header = 'N°,Code,Description,Location,Mode,Datetime\n';
    const rows = alarms.map((a, i) =>
      `${i + 1},"${a.code}","${a.description}","${a.location}","${a.mode}","${a.timestamp}"`
    ).join('\n');

    const content = header + rows;

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link)
  }

  // backgroundColor: "#010923",
  
  return (
    <Container data-aos="zoom-in" fluid style={{ minHeight: "100vh", padding: "2rem 1rem" }}>
      <Row className="mb-4 mt-5 justify-content-center">
        <Col xs={12} md={10} lg={8}>
          <h1 style={{ color: "white" }}>Alarms History</h1>
          <Badge bg="secondary">{almHistory.length} alarms found <CiWarning /></Badge>
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
                {almHistory.map((alarm, idx) => (
                  <tr key={idx}>
                    <td>{alarm.code}</td>
                    <td>{alarm.description}</td>
                    <td>{alarm.location}</td>
                    <td>{alarm.mode}</td>
                    <td>{alarm.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          <Button className="mt-3" variant="success" onClick={() => alarmsCSV(almHistory)}>
            <FaFileCsv /> Download CSV
          </Button>
        </Col>
      </Row>
    </Container>
  )
}

export default Alarms