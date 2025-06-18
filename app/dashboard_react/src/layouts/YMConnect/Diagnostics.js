import { Container, Table, Badge, Button } from 'react-bootstrap'
import withReactContent from "sweetalert2-react-content"
import InfoButton from "../../components/InfoButton"
import InfoModal from "../../components/InfoModal"
import { GiHealingShield } from "react-icons/gi"
import "bootstrap/dist/css/bootstrap.min.css"
import { IoMdRefresh } from "react-icons/io"
import { useEffect, useState } from "react"
import Swal from "sweetalert2"
import axios from "axios"
import "aos/dist/aos.css"
import AOS from "aos"


const MySwal = withReactContent(Swal)
const ymConnectService = 'http://localhost:5229'

const stopKeys = ['pendantStop', 'externalStop', 'doorEmergencyStop', 'hold']

const RobotInfo = () => {
  const [ioList, setIoList] = useState([])
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [materialOn, setMaterialOn] = useState(false)

  const info = `
ℹ️ Diagnostics Screen – User Guide

This screen is designed to display the most critical robot signals for real-time monitoring 🖥️.

It provides essential status indicators, including:

🔌 I/O Signals – Key input and output states such as:  
- Remote Mode, Teach Mode, and Play Mode  
- Internal and External Emergency Stops  
- Servo ON status  
- Active tool signal (e.g., Torch or Dremel)

🛠️ A dedicated button is available to manually toggle the Dremel ON/OFF for quick testing and control.

🔄 A refresh button is located at the bottom of the screen to update the displayed values and ensure signal accuracy.

🧩 This diagnostic data is vital for evaluating the robot's operating conditions and for troubleshooting potential issues.
`;


  const handleShowInfo = () => {
    setShowInfoModal(true)
  }

  useEffect(() => {
    AOS.init()
    fetchDiagnostic()
  }, [])

  const fetchDiagnostic = async () => {
    try {
      const res = await axios.get(`${ymConnectService}/Alarms/readIO`)
      const data = res.data

      if (typeof data === 'object' && data !== null) {
        const ioArray = Object.entries(data).map(([key, value]) => ({
          name: key,
          active: stopKeys.includes(key) ? !value : value // inverso para los stop
        }))
        setIoList(ioArray)
      } else {
        throw new Error('Respuesta inesperada del servidor')
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

  const checkMaterial = async () => {
    try {
      setMaterialOn(!materialOn)
      const res = await axios.get(`${ymConnectService}/Alarms/writeIO`, { params: { robot_ip: "192.168.1.30", value: materialOn } })
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
              <th className="text-center" colSpan={2}><h3>Check Material</h3></th>
            </tr>
            <tr>
              <th className="text-center">IO to check</th>
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
                <td colSpan={2} className="text-center text-muted">No data available.</td>
              </tr>
            )}
          </tbody>
        </Table>
        <Button variant="success" className="m-2 pr-1" onClick={() => fetchDiagnostic()}>
          <IoMdRefresh /> Refresh
        </Button>
        <InfoModal show={showInfoModal} close={() => setShowInfoModal(false)} content={info} />
      </Container>
      <InfoButton onClick={handleShowInfo} />
    </>
  )
}

export default RobotInfo