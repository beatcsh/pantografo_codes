import { Container, Row, Navbar, Nav, Badge, Table, Card } from 'react-bootstrap';
import { RiRobot2Fill } from "react-icons/ri";
import { useState, useEffect } from 'react';
import axios from 'axios';

const ymconnectService = "http://localhost:5229";
const ftp_files = "http://localhost:8000"

const StatsRobot = () => {

    const [jobList, setJobList] = useState([]);
    const [infoRobot, setInfoRobot] = useState({});
    const [statusRobot, setStatusRobot] = useState({});
    const [coordinates, setCoordinates] = useState([]);

    useEffect(() => {
        const obtenerDatos = async () => {
            try {
                const [jobsRes, robotRes, robotSta, resCoordinates] = await Promise.all([
                    axios.get(`${ftp_files}/listar-jobs`),
                    axios.get(`${ymconnectService}/Robot/information`),
                    axios.get(`${ymconnectService}/Robot/status`),
                    axios.get(`${ymconnectService}/Robot/coordinates`)
                ]);
                setJobList(jobsRes.data);
                setInfoRobot(robotRes.data);
                setStatusRobot(robotSta.data);
                setCoordinates(resCoordinates.data);

            } catch (error) {
                console.error("Error al obtener datos:", error);
            }
        };

        obtenerDatos();
    }, []);

    return (
        <>
            <Navbar
                expand="lg"
                bg="dark"
                variant="dark"
                className="px-4 shadow"
                style={{ background: "#414345" }}
            >
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


                    <h1>Conexion YMConnect</h1>

                    <Card className='m-3' bg='dark' style={{ color: '#ffffff' }}>
                        <Card.Body>
                            <Card.Title className='mb-3'>Informacion del Sistema</Card.Title>
                            <Card.Text>Software utilizado: {infoRobot.softwareVersion}</Card.Text>
                            <Card.Text>Modelo del controlador: {infoRobot.modelName}</Card.Text>
                        </Card.Body>
                    </Card>

                    <Card className='m-3' bg='dark' style={{ color: '#ffffff' }}>
                        <Card.Body>
                            <Card.Title className='mb-3'>Estado del robot</Card.Title>
                            <Card.Text>Ciclo del robot: {statusRobot.cycleMode}</Card.Text>
                            <Card.Text>Modo de control: {statusRobot.controlMode}</Card.Text>
                            <Card.Text>Ejecutando un archivo: {statusRobot.isRunning ? "Trabajando en un archivo" : "Ningun archivo en ejecucion"}</Card.Text>
                            <Card.Text>Alarmas activas: {statusRobot.isAlarming ? "Hay alarmas" : "Sin alarmas"}</Card.Text>
                            <Card.Text>Errores activos: {statusRobot.isErroring ? "Hay errores activos" : "Sin errores"}</Card.Text>
                            <Card.Text>Servos: {statusRobot.isServoOn ? "Servos encendidos" : "Servos apagados"}</Card.Text>
                            <Card.Text>Hold: {statusRobot.isInHold ? "En espera" : "Modo en espera desactivado"}</Card.Text>
                        </Card.Body>
                    </Card>

                    <Card className='m-3' bg='dark' style={{ color: '#ffffff' }}>
                        <Card.Body>
                            <Card.Title className='mb-3'>Coordenadas del robot (Pulsos por MM)</Card.Title>
                            <Card.Text>Coordenadas:</Card.Text>
                            {coordinates?.map((coo, idx) => (
                                <Card.Text key={idx}>{coo}</Card.Text>
                            ))}
                        </Card.Body>
                    </Card>

                    <Table hover responsive borderless className="mb-5 shadow" variant="dark" xs={12} sm={10} md={6} lg={4} >
                        <thead>
                            <tr><th>#</th><th>Archivo</th></tr>
                        </thead>
                        <tbody>
                            {
                                jobList?.map((job, idx) => (
                                    <tr key={idx}>
                                        <td>{idx + 1}</td>
                                        <td>{job}</td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </Table>
                </Row>
            </Container>
        </>
    );
};

export default StatsRobot;