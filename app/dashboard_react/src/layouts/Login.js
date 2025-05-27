import 'bootstrap/dist/css/bootstrap.min.css';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { Container, Row, Col } from 'react-bootstrap';
import React, { useState } from 'react';

const USERS = {
  admin: { password: 'admin', type: 'admin' },
  user: { password: 'user', type: 'user' }
};

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (USERS[username] && USERS[username].password === password) {
            onLogin({ username, type: USERS[username].type });
        } else {
            setError('Usuario o contraseña incorrectos');
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
                        background: 'linear-gradient(180deg, #0072ff 0%, #003366 100%)',
                        color: '#fff',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        padding: '0 0 0 7vw',
                        position: 'relative',
                        minHeight: 480
                    }}>
                        <div style={{ zIndex: 2 }}>
                            <h1 style={{ fontWeight: 900, fontSize: '2.8em', letterSpacing: 2, marginBottom: 24 }}>YASKAWA</h1>
                            <h2 style={{ fontWeight: 900, fontSize: '2em', marginBottom: 8 }}>WELCOME BACK!</h2>
                            <div style={{ fontSize: 18, fontWeight: 400, marginBottom: 32, color: '#e0e6f7' }}>
                                This application is developed<br />by the Yaskawa Motoman Mexico engineering team.
                            </div>
                        </div>
                        <img src={process.env.PUBLIC_URL + '/assets/robot_yaskawa.png'} alt="robot" style={{
                            position: 'absolute',
                            left: 0,
                            bottom: 0,
                            width: '60%',
                            minWidth: 260,
                            maxWidth: 420,
                            zIndex: 1,
                            filter: 'drop-shadow(0 8px 32px #00336688)'
                        }} />
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
                                <div style={{ textAlign: 'center', margin: '0 auto', marginBottom: 18 }}>
                                    <svg width="110" height="110" viewBox="0 0 110 110" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="55" cy="55" r="50" stroke="#111" strokeWidth="6" />
                                        {/* Solo usuario, sin flecha */}
                                        <circle cx="55" cy="40" r="13" fill="#111" />
                                        <rect x="40" y="60" width="30" height="18" rx="9" fill="#111" />
                                    </svg>
                                </div>
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
                                    style={{ borderRadius: 8, fontWeight: 700, fontSize: '1.2em', padding: '0.9em 0', background: '#0072ff', border: 'none', letterSpacing: 1 }}>
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