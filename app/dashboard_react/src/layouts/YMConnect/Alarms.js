import { Container, Table, Button, Row, Col, Badge, Card } from "react-bootstrap"
import withReactContent from "sweetalert2-react-content"
import { useState, useEffect } from "react"
import Swal from "sweetalert2"
import axios from "axios"
import AOS from "aos"
import 'aos/dist/aos.css'

const MySwal = withReactContent(Swal)
const ymConnectService = "http://localhost:5229"

const alarms = Array(8).fill({
  name: 'alarm_example',
  code: 'alarm_example_code 02941',
  subcode: 'alarm_example',
  date: 'alarm_example',
  action: 'Active',
})

const Alarms = () => {

  const [almHistory, setAlmHistory] = useState("")

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        AOS.init()
        const res = await axios.get(`${ymConnectService}/Alarms/getAlarmsHistory`)
        setAlmHistory(res.data)
      } catch (error) {
        MySwal.fire({
          icon: "error",
          title: "Conexión perdida.",
          timer: 10000,
          showConfirmButton: false
        })
      }
    }

    fetchHistory()
  }, [])

  return (
    <Container fluid style={{ backgroundColor: "#010923", minHeight: "100vh", padding: "5rem" }}>
      <Row className="mb-4 mt-5">
        <Col>
          <h1 style={{ color: "white", marginTop: '30px' }}>Alarms History</h1>
        </Col>
      </Row>
      <Row className="justify-content-center">
        <Col>
          <Card style={{ width: '90%' }}>
            <Card.Body>
              <Card.Title>Historial</Card.Title>
              <Card.Text>
                funciona
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default Alarms
