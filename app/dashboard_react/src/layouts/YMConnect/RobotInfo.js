import { Container, Table, Badge, Tabs, Tab } from 'react-bootstrap'
import withReactContent from 'sweetalert2-react-content'
import InfoButton from "../../components/InfoButton"
import InfoModal from "../../components/InfoModal"
import 'bootstrap/dist/css/bootstrap.min.css'
import { useEffect, useState } from 'react'
import { FaRobot } from 'react-icons/fa'
import Swal from 'sweetalert2'
import axios from 'axios'
import 'aos/dist/aos.css'
import AOS from 'aos'

const labels = {
  cycleMode: 'Cycle Mode',
  isRunning: 'Running',
  controlMode: 'Control Mode',
  isInHold: 'In Hold',
  isAlarming: 'Alarming',
  isErroring: 'Erroring',
  isServoOn: 'Servo On',
}

const soft_labels = {
  sofwareVersion: 'Software Version',
  modelName: 'Model'
}

// let alreadyFetchedStatus = false

const MySwal = withReactContent(Swal)
const ymConnectService = 'http://localhost:5229'

const RobotInfo = () => {
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [robotStatus, setRobotStatus] = useState({})
  const [robotInfo, setRobotInfo] = useState({})
  const [activeTab, setActiveTab] = useState('status')

  const info = `
ℹ️ Robot Information Screen - User Guide

This screen provides basic information about the robot’s current state:

🛠️ Operational Mode: Displays whether the robot is in Teach, Play, or Remote mode.
🚨 Active Alarms: Shows if any alarms or errors are currently active.
📋 Current Job: Indicates whether a job is currently being executed.

The information is divided into two tabs:

1️⃣ **Status Tab** – General state, mode, active alarms, and job activity.
2️⃣ **Software Tab** – Displays system software version and firmware information, which are important for diagnostics and updates.
`;


  useEffect(() => {
    AOS.init()
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const res = await axios.get(`${ymConnectService}/Robot/status`)
      setRobotStatus(res.data)
    } catch (error) {
      MySwal.fire({
        icon: 'error',
        title: 'Conexión perdida.',
        timer: 10000,
        showConfirmButton: false,
      })
    }
  }

  // if (!alreadyFetchedStatus) {
  //   alreadyFetchedStatus = true
  //   fetchStatus()
  // }

  const fetchInfo = async () => {
    try {
      const res = await axios.get(`${ymConnectService}/Robot/information`)
      setRobotInfo(res.data)
    } catch (error) {
      MySwal.fire({
        icon: 'error',
        title: 'Conexión perdida.',
        timer: 10000,
        showConfirmButton: false,
      })
    }
  }

  const valueDisplay = (key, value) => {
    if (typeof value === 'boolean') {
      return (
        <Badge
          bg={value ? 'primary' : 'secondary'}
          style={{
            fontSize: '1rem',
            padding: '0.55em 1.4em',
            fontWeight: 600,
            borderRadius: '2em',
            boxShadow: value ? '0 0 10px #8fffa040' : '0 0 10px #ff5a5a40',
            transition: 'all 0.3s ease-in-out',
          }}
        >
          {value ? 'Yes' : 'No'}
        </Badge>
      )
    }

    if (key === 'cycleMode') {
      return value === 0 ? 'Step' : value === 1 ? 'Cycle' : value === 2 ? 'Auto' : value
    }

    if (key === 'controlMode') {
      return value === 0 ? 'Teach' : value === 1 ? 'Play' : value === 2 ? 'Remote' : value
    }

    return value
  }

  const handleShowInfo = () => {
    setShowInfoModal(true)
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
          margin: '20px',
        }}
      >
        <h2
          style={{
            fontFamily: 'Montserrat, Arial, sans-serif',
            fontWeight: 700,
            fontSize: '2.2rem',
            marginBottom: '30px',
            textAlign: 'center',
            color: '#0d47a1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
          }}
        >
          <FaRobot />
          Robot Information
        </h2>

        <Tabs
          className="mb-3"
          activeKey={activeTab}
          onSelect={(k) => {
            setActiveTab(k)
            if (k === 'status') fetchStatus()
            if (k === 'info') fetchInfo()
          }}
          justify
        >
          <Tab eventKey="status" title="Robot Status">
            <Table
              responsive
              bordered
              hover
              style={{
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
              }}
            >
              <thead style={{ backgroundColor: '#e3f2fd' }}>
                <tr>
                  <th style={{ width: '50%', fontWeight: '600', color: '#0d47a1' }}>Parameter</th>
                  <th style={{ width: '50%', fontWeight: '600', color: '#0d47a1' }}>Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(robotStatus).length > 0 ? (
                  Object.entries(robotStatus).map(([key, value]) => (
                    <tr key={key}>
                      <td style={{ fontWeight: 500, color: '#37474f' }}>
                        {labels[key] || key}
                      </td>
                      <td>
                        {valueDisplay(key, value)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="text-center text-muted">
                      No data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Tab>
          <Tab eventKey="info" title="Software Data">
            <Table
              responsive
              bordered
              hover
              style={{
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
              }}
            >
              <thead style={{ backgroundColor: '#e3f2fd' }}>
                <tr>
                  <th style={{ width: '50%', fontWeight: '600', color: '#0d47a1' }}>Data</th>
                  <th style={{ width: '50%', fontWeight: '600', color: '#0d47a1' }}>Description</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(robotInfo).length > 0 ? (
                  Object.entries(robotInfo).map(([key, value]) => (
                    <tr key={key}>
                      <td style={{ fontWeight: 500, color: '#37474f' }}>
                        {soft_labels[key] || key}
                      </td>
                      <td>
                        {valueDisplay(key, value)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="text-center text-muted">
                      No data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Tab>
        </Tabs>
        <InfoModal show={showInfoModal} close={() => setShowInfoModal(false)} content={info} />
      </Container>
      <InfoButton onClick={handleShowInfo} />
    </>
  )
}

export default RobotInfo