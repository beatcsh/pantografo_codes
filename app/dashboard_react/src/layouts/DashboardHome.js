import { Container, Row, Navbar, Nav, Badge } from 'react-bootstrap';
import { IoHomeSharp } from "react-icons/io5";
import CardsHome from '../components/CardsHome';

const DashboardHome = () => {
    return (
        <>
            <Navbar
                expand="lg"
                bg="dark"
                variant="dark"
                className="px-4 shadow"
                style={{ background: "#414345" }}
            >
                <Navbar.Brand className="fw-bold fs-4">Usuario</Navbar.Brand>
                <Nav className="ms-auto">
                    <Badge bg="primary" className="p-2 mt-2 mt-lg-0"><IoHomeSharp size={20} /></Badge>
                </Nav>
            </Navbar>

            <Container
                fluid
                className="d-flex justify-content-center align-items-center"
                style={{
                    minHeight: '100vh',
                    background: '#232526',
                    padding: '2.5em 2em',
                    backdropFilter: 'blur(2px)',
                }}
            >
                <Row className="text-center w-100 justify-content-center">
                    <CardsHome />
                </Row>
            </Container>
        </>
    );
};

export default DashboardHome;