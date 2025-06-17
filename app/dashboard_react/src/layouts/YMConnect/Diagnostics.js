import { Container, Table, Badge, Button } from 'react-bootstrap'
import withReactContent from "sweetalert2-react-content"
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

  return (
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
      <h2 className="text-center mb-4 text-primary d-flex align-items-center justify-content-center gap-3">
        <GiHealingShield />
        Diagnostics
      </h2>

      <Table bordered hover responsive>
        <thead className="table-light">
          <tr>
            <th className="text-center">Name</th>
            <th className="text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(ioList) && ioList.map((io, idx) => (
            <tr key={idx}>
              <td className="text-center text-uppercase">{io.name}</td>
              <td className="text-center">
                <Badge bg={io.active ? 'primary' : 'secondary'} pill>
                  {io.active ? 'ACTIVE' : 'INACTIVE'}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Button variant="success" className="m-2 pr-1" onClick={() => fetchDiagnostic()}>
        <IoMdRefresh /> Refresh
      </Button>
    </Container>
  )
}

export default RobotInfo