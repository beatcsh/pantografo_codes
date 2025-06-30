import { Spinner, Container, Table, Badge, Button, Accordion } from 'react-bootstrap'
import withReactContent from "sweetalert2-react-content"
import InfoButton from "../../components/InfoButton"
import InfoModal from "../../components/InfoModal"
import { GiHealingShield } from "react-icons/gi"
import "bootstrap/dist/css/bootstrap.min.css"
import { IoMdRefresh } from "react-icons/io"
import { useEffect, useState, useRef } from "react"
import * as signalR from '@microsoft/signalr'
import Swal from "sweetalert2"
import axios from "axios"
import "aos/dist/aos.css"
import AOS from "aos"


const MySwal = withReactContent(Swal)
const ymConnectService = 'http://localhost:5229'

const stopKeys = ['pendantStop', 'externalStop', 'doorEmergencyStop', 'hold']

const RobotInfo = ({ robot_ip, setActive }) => {
  const [ioList, setIoList] = useState([])
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [activeAlarms, setActiveAlarms] = useState({
    count: 0,
    alarms: []
  })
  const [materialOn, setMaterialOn] = useState(true)
  const connectionRef = useRef(null)

  const info = `
ℹ️ Diagnostics Screen – User Guide

This screen is designed to display the most critical robot signals for real-time monitoring 🖥️.

It provides essential status indicators, including:

🔌 I/O Signals – Key input and output states such as:  
- Remote Mode, Teach Mode, and Play Mode  
- Internal and External Emergency Stops  
- Servo ON status  
- Active tool signal (e.g., Torch or Dremel)

🔄 A refresh button is located at the bottom of the screen to update the displayed values and ensure signal accuracy.

🛠️ A dedicated button is available to manually toggle the Dremel ON/OFF for quick testing and control.

🚨 The section of active alarms is available and if you want to get the current alarms on the robot manually yo can 
click the button of Check Alarms, if your plan is viewing the history you can navigate to the screen by clicking on
the button or in the side navbar.

🧩 This diagnostic data is vital for evaluating the robot's operating conditions and for troubleshooting potential issues.
`;

  const handleShowInfo = () => {
    setShowInfoModal(true)
  }

  useEffect(() => {
    AOS.init()

    // Crear o reutilizar la conexión SignalR
    if (!connectionRef.current) {
      const connection = new signalR.HubConnectionBuilder()
        .withUrl(`${ymConnectService}/robotHub`)
        .withAutomaticReconnect()
        .build()

      connection.on("RobotDiagnostic", (results) => {
        console.log("Diagnostico recibido:", results)
        if (typeof results === 'object') {
          const ioArray = Object.entries(results).map(([key, value]) => ({
            name: key,
            active: stopKeys.includes(key) ? !value : value // inverso para los stop
          }))
          setIoList(ioArray)
        }
      })

      connection.start()
        .then(() => {
          console.log("Conectado al RobotHub")
          connection.invoke("SetRobotIp", robot_ip).catch(console.error)
        })
        .catch(err => console.error("Error en SignalR:", err))

      connectionRef.current = connection
    } else {
      // Si cambia robot_ip avisar al Hub
      connectionRef.current.invoke("SetRobotIp", robot_ip).catch(console.error)
    }

    // Opcional: limpiar la conexión al desmontar el componente
    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop()
        connectionRef.current = null
      }
    }
  }, [robot_ip])

  const checkMaterial = async () => {
    try {
      setMaterialOn(!materialOn)
      const res = await axios.get(`${ymConnectService}/IoInterface/writeIO`, { params: { robot_ip: robot_ip, value: materialOn } })
      return res
    } catch (error) {
      console.error(error)
      MySwal.fire({
        icon: 'error',
        title: 'Conexión perdida.',
        text: error.message,
        timer: 10000,
        showConfirmButton: false,
      })
    }
  }

  const checkAlarms = async () => {
    try {
      const res = await axios.get(`${ymConnectService}/Alarms/activeAlarms`, { params: { robot_ip: robot_ip } })
      if (res.data.count === 0) {
        MySwal.fire({
          icon: 'success',
          title: 'No alarms detected.',
          timer: 10000,
          showConfirmButton: true,
        })
        setActiveAlarms(res.data)
      } else {
        setActiveAlarms(res.data)
      }
    } catch (error) {
      console.error(error)
      MySwal.fire({
        icon: 'error',
        title: 'Conexión perdida.',
        text: error.message,
        timer: 10000,
        showConfirmButton: false,
      })
    }
  }

  return (
    <>
      <Container
        data-aos="zoom-in"
        style={{
          maxWidth: '800px',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          padding: '40px 30px',
          margin: '50px auto',
        }}
        className='mt-5'
      >
        <h2 className="text-center mb-5 text-primary d-flex align-items-center justify-content-center gap-3">
          <GiHealingShield />
          Diagnostics
        </h2>

        <Table bordered hover responsive>
          <thead className="table-light">
            <tr>
              <th className="text-center" colSpan={2}><h3>IO Interface</h3></th>
            </tr>
            <tr>
              <th className="text-center">Name</th>
              <th className="text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(ioList) && ioList.length > 0 ? (
              ioList.map((io, idx) => (
                <tr key={idx}>
                  <td className="text-center text-uppercase">{io.name}</td>
                  <td className="text-center">
                    <Badge bg={io.active ? 'primary' : 'secondary'} pill>
                      {io.active ? 'ACTIVE' : 'INACTIVE'}
                    </Badge>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} className="text-center text-muted">
                  <Spinner animation="border" role="status" className="mt-3">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                  <p>No data available</p>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
        {/* <Button variant="success" className="mb-4 mt-4 pr-1" onClick={() => fetchDiagnostic()}>
          <IoMdRefresh /> Refresh
        </Button> */}

        <Accordion alwaysOpen defaultActiveKey="0">
          <Accordion.Item eventKey="0">
            <Accordion.Header>Material Revision</Accordion.Header>
            <Accordion.Body>
              <Table bordered hover responsive>
                <thead className="table-light">
                  <tr>
                    <th className="text-center" colSpan={2}><h3>Check Material</h3></th>
                  </tr>
                  <tr>
                    <th className="text-center">Material</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      Check Dremel/Torch
                    </td>
                    <td className="text-center">
                      <Button
                        variant={materialOn ? 'outline-success' : 'danger'}
                        onClick={() => checkMaterial()}
                      >
                        {materialOn ? 'ON' : 'OFF'}
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Accordion.Body>
          </Accordion.Item>
          <Accordion.Item eventKey="1">
            <Accordion.Header>Active Alarms</Accordion.Header>
            <Accordion.Body style={{ textAlign: 'center' }}>
              {/* {
              "code": 0,
              "subcode": 0,
              "time": "",
              "name": ""
            } */}
              <Table responsive borderless className='mb-0'>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Subcode</th>
                    <th>Name</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(activeAlarms.alarms) && activeAlarms.count > 0 ? (
                    activeAlarms.alarms.map((alarm, idx) => (
                      <tr key={idx}>
                        <td>{alarm.code}</td>
                        <td>{alarm.subcode}</td>
                        <td>{alarm.name}</td>
                        <td>{alarm.time}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4}>
                        <div style={{ textAlign: 'center' }}>
                          <p>No data available</p>
                          <Spinner animation="border" role="status" className="mb-3">
                            <span className="visually-hidden">Loading...</span>
                          </Spinner>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <Button variant="primary" onClick={() => checkAlarms()}>
                            Check Alarms
                          </Button>
                          <Button variant="warning" style={{ marginLeft: '15px' }} onClick={() => setActive('alarms')}>
                            View History
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
              {/*  */}
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
        <InfoModal show={showInfoModal} close={() => setShowInfoModal(false)} content={info} />
      </Container>
      <InfoButton onClick={handleShowInfo} />
    </>
  )
}

export default RobotInfo