import { Container, Row, Navbar, Nav, Badge, Table, Card, Button, Col } from 'react-bootstrap'
import { RiRobot2Fill } from "react-icons/ri"
import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const ymconnectService = "http://localhost:5229"
const ftp_files = "http://localhost:8000"

const StatsRobot = () => {
    const [jobList, setJobList] = useState([])
    const [infoRobot, setInfoRobot] = useState({})
    const [statusRobot, setStatusRobot] = useState({})
    const [coordinates, setCoordinates] = useState([])

    const listarJobs = async () => {
        try {
            const res = await axios.get(`${ftp_files}/listar-jobs`)
            setJobList(res.data)
        } catch (error) {
            console.error("Error al listar jobs:", error)
        }
    }

    const getInfoRobot = async () => {
        try {
            const res = await axios.get(`${ymconnectService}/Robot/information`)
            setInfoRobot(res.data)
        } catch (error) {
            console.error("Error al obtener información del robot:", error)
        }
    }

    const getStatusRobot = async () => {
        try {
            const res = await axios.get(`${ymconnectService}/Robot/status`)
            setStatusRobot(res.data)
        } catch (error) {
            console.error("Error al obtener estado del robot:", error)
        }
    }

    const getCoordinates = async () => {
        try {
            const res = await axios.get(`${ymconnectService}/Robot/coordinates`)
            setCoordinates(res.data)
        } catch (error) {
            console.error("Error al obtener coordenadas:", error)
        }
    }

    const changeJob = async (file) => {
        try {
            const selected = file.includes('.')
                ? file.substring(0, file.lastIndexOf('.'))
                : file

            const confirmar = window.confirm(`Seleccionaste el archivo "${selected}". ¿Quieres dejarlo listo?`)

            if (confirmar) {
                const reqUrl = `${ymconnectService}/Robot/setJob/${selected}`
                const res = await axios.get(reqUrl)

                if (res.data.statusCode === 0) {
                    alert("El archivo se estableció correctamente.")
                } else {
                    alert("Ocurrió un problema al establecer el archivo.")
                }
            }
        } catch (error) {
            console.error("Error al cambiar al archivo:", error)
        }
    }

    const executeJob = async () => {
        try {
            const reqUrl = `${ymconnectService}/Robot/startJob`
            const res = await axios.get(reqUrl)
            if (res.data.statusCode === 0) {
                alert("Ejecutado correctamente.")
            } else {
                alert("Error al ejecutar el archivo.")
            }
            getStatusRobot()
        } catch (error) {
            console.error("Error al cambiar al archivo:", error)
        }
    }


    const stopJob = async () => {
        try {
            const reqUrl = `${ymconnectService}/Robot/stopJob`
            const res = await axios.get(reqUrl)
            if (res.data.statusCode === 0) {
                alert("Detenido correctamente.")
            } else {
                alert("Error al detener el archivo.")
            }
            getStatusRobot()
        } catch (error) {
            console.error("Error al cambiar al archivo:", error)
        }
    }

    return (
        <>
            <Navbar expand="lg" bg="dark" variant="dark" className="px-4 shadow" style={{ background: "#414345" }}>
                <Nav className="ms-auto">
                    <Badge bg="primary" className="p-2 mt-2 mt-lg-0"><RiRobot2Fill size={25} /></Badge>
                </Nav>
            </Navbar>

            <Container
                fluid
                className="d-flex justify-content-center align-items-center"
                style={{
                    minHeight: '100vh',
                    background: '#232526',
                    backdropFilter: 'blur(2px)',
                }}
            >
                <Row style={{ color: "#ffffff" }} className="text-center w-100 justify-content-center">
                    <h1>Conexión YMConnect</h1>

                    {/* Botones para cada solicitud */}
                    <div className="mb-4">
                        <Button variant="primary" className="m-2" onClick={listarJobs}>Listar Jobs</Button>
                        <Button variant="success" className="m-2" onClick={getInfoRobot}>Info del Robot</Button>
                        <Button variant="warning" className="m-2" onClick={getStatusRobot}>Estado del Robot</Button>
                        <Button variant="info" className="m-2" onClick={getCoordinates}>Coordenadas</Button>
                    </div>

                    <Row className='text-center w-100 justify-content-center mb-5'>
                        <Col>
                            <Card className='m-3 p-4' bg='dark' style={{ color: '#ffffff' }}>
                                <Card.Title>Lista de Jobs cargados en el robot</Card.Title>
                                <Card.Body>
                                    <Table hover responsive borderless variant="dark">
                                        <thead>
                                            <tr><th>#</th><th>Archivo</th></tr>
                                        </thead>
                                        <tbody>
                                            {
                                                jobList?.map((job, idx) => (
                                                    <tr onClick={() => changeJob(job)} key={idx}>
                                                        <td>{idx + 1}</td>
                                                        <td>{job}</td>
                                                    </tr>
                                                ))
                                            }
                                        </tbody>
                                    </Table>
                                </Card.Body>
                            </Card>
                            <Button variant="success" className="m-2" onClick={executeJob}>Ejecutar Job Activo</Button>
                            <Button variant="danger" className="m-2" onClick={stopJob}>Detener Job Activo</Button>
                            <Card className='m-3' bg='dark' style={{ color: '#ffffff' }}>
                                <Card.Body>
                                    <Card.Title className='mb-3'>Coordenadas del Robot (Pulsos por MM)</Card.Title>
                                    <Card.Text>Coordenadas:</Card.Text>
                                    {coordinates?.map((coo, idx) => (
                                        coo !== 0 && <Card.Text key={idx}>{coo}</Card.Text>
                                    ))}
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col>
                            <Card className='m-3' bg='dark' style={{ color: '#ffffff' }}>
                                <Card.Body>
                                    <Card.Title className='mb-3'>Información del Sistema</Card.Title>
                                    <Card.Text>Software utilizado: {infoRobot.softwareVersion}</Card.Text>
                                    <Card.Text>Modelo del controlador: {infoRobot.modelName}</Card.Text>
                                </Card.Body>
                            </Card>

                            <Card className='m-3' bg='dark' style={{ color: '#ffffff' }}>
                                <Card.Body>
                                    <Card.Title className='mb-3'>Estado del Robot</Card.Title>
                                    <Card.Text>Ciclo del robot: {statusRobot.cycleMode}</Card.Text>
                                    <Card.Text>Modo de control: {statusRobot.controlMode}</Card.Text>
                                    <Card.Text
                                        className={`text-white p-2 rounded ${statusRobot.isRunning ? "bg-primary" : "bg-secondary"}`}
                                    >
                                        Ejecutando un archivo: {statusRobot.isRunning ? "Trabajando en un archivo" : "Ningún archivo en ejecución"}
                                    </Card.Text>
                                    <Card.Text>Alarmas activas: {statusRobot.isAlarming ? "Hay alarmas" : "Sin alarmas"}</Card.Text>
                                    <Card.Text>Errores activos: {statusRobot.isErroring ? "Hay errores activos" : "Sin errores"}</Card.Text>
                                    <Card.Text>Servos: {statusRobot.isServoOn ? "Servos encendidos" : "Servos apagados"}</Card.Text>
                                    <Card.Text>Hold: {statusRobot.isInHold ? "En espera" : "Modo en espera desactivado"}</Card.Text>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Row>
            </Container>
        </>
    )
}

export default StatsRobot
