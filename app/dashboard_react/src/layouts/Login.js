import 'bootstrap/dist/css/bootstrap.min.css';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { Container, Row, Col } from 'react-bootstrap';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserCog } from "react-icons/fa";

const USERS = {
    admin: { password: 'admin', type: 'admin' },
    operator: { password: 'operator', type: 'user' }
};

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (USERS[username] && USERS[username].password === password) {
            const userObj = { username, type: USERS[username].type };
            if (onLogin) onLogin(userObj);
            // Redirigir según tipo de usuario
            if (USERS[username].type === 'admin') navigate('/home', { replace: true });
            else navigate('/ymconnect', { replace: true });
        } else {
            setError('Please enter a valid username and password.');
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            width: '100vw',
            display: 'flex',
            alignItems: 'stretch',
            justifyContent: 'center',
            background: '#fff',
        }}>
            <Container fluid style={{ maxWidth: '100vw', height: '100vh', padding: 0 }}>
                <Row style={{ height: '100vh' }}>
                    {/* Lado izquierdo: fondo azul, logo, texto, robot */}
                    <Col md={6} style={{
                        // background: 'linear-gradient(180deg, #0072ff 0%, #003366 100%)',
                        color: '#fff',
                        backgroundImage: 'url("../assets/bg.jpeg")',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        padding: '0 0 0 7vw',
                        position: 'relative',
                        minHeight: 480
                    }}>
                        <div style={{ zIndex: 2 }}>
                            <img src='../assets/white_yaskawa.png' style={{ width: '280px', fontWeight: 900, fontSize: '2.8em', letterSpacing: 2, marginBottom: 24 }} />
                            <h2 style={{ marginLeft: '15px', fontWeight: 900, fontSize: '2em', marginBottom: 8 }}>WELCOME BACK!</h2>
                            <div style={{ marginLeft: '15px', fontSize: 18, fontWeight: 400, marginBottom: 32, color: '#e0e6f7' }}>
                                This application is developed<br />by the Yaskawa Motoman Mexico engineering team.
                            </div>
                        </div>
                        {/* <img src='../assets/white_yaskawa.png' style={{
                            position: 'absolute',
                            left: 0,
                            bottom: 0,
                            margin: '15px',
                            width: '20%',
                            zIndex: 1,
                            filter: 'drop-shadow(0 8px 32px #00336688)'
                        }} /> */}
                    </Col>
                    {/* Lado derecho: login */}
                    <Col md={6} style={{
                        background: '#fff',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: 480
                    }}>
                        <div style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '0 2vw' }}>
                            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                                <h2 style={{ fontWeight: 900, color: '#111', marginBottom: 0, fontSize: '1.5em', letterSpacing: 1 }}>Log in to Start to Convert Files</h2>
                                <div style={{ color: '#888', fontWeight: 400, fontSize: 16, marginTop: 2, marginBottom: 18 }}>Put a valid user to operate this application.</div>
                                <FaUserCog size={110} color="#1876d3" />
                            </div>
                            <Form onSubmit={handleSubmit} style={{ width: '100%' }}>
                                <Row>
                                    <Col xs={12} md={6} style={{ marginBottom: 16 }}>
                                        <Form.Label style={{ color: '#111', fontWeight: 600, fontSize: 15 }}>USER NAME</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="User Name"
                                            value={username}
                                            onChange={e => setUsername(e.target.value)}
                                            style={{ background: '#fff', color: '#111', border: '1.5px solid #bbb', borderRadius: 8, fontWeight: 600, fontSize: 16, marginBottom: 6 }}
                                        />
                                    </Col>
                                    <Col xs={12} md={6} style={{ marginBottom: 16 }}>
                                        <Form.Label style={{ color: '#111', fontWeight: 600, fontSize: 15 }}>PASSWORD</Form.Label>
                                        <Form.Control
                                            type="password"
                                            placeholder="Password"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            style={{ background: '#fff', color: '#111', border: '1.5px solid #bbb', borderRadius: 8, fontWeight: 600, fontSize: 16, marginBottom: 6 }}
                                        />
                                    </Col>
                                </Row>
                                <Button
                                    variant="primary"
                                    type="submit"
                                    className="w-100 mb-2"
                                    style={{ borderRadius: 8, fontWeight: 700, fontSize: '1.2em', padding: '0.9em 0', background: '#1876d3', border: 'none', letterSpacing: 1 }}>
                                    GET STARTED &rarr;
                                </Button>
                                {error && <p style={{ color: '#e53935', textAlign: 'center', marginTop: 10 }}>{error}</p>}
                            </Form>
                        </div>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}

export default Login;