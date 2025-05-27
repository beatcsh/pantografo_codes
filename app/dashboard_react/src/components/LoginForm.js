import 'bootstrap/dist/css/bootstrap.min.css';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { Container } from 'react-bootstrap';
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
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #232526 0%, #414345 100%)',
        }}>
            <Container style={{
                width: 'clamp(350px, 32vw, 500px)',
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 18,
                boxShadow: '0 4px 32px 0 rgba(0,0,0,0.12)',
                padding: '3em 2em',
                backdropFilter: 'blur(2px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '350px',
            }}>
                <h2 style={{textAlign:'center', color:'#fff', fontWeight:700, marginBottom:'1.5em', letterSpacing:1, fontSize:'2.1em'}}>Iniciar sesión</h2>
                <Form onSubmit={handleSubmit} style={{width:'100%'}}>
                    <Form.Group className="mb-3" controlId="formBasicEmail">
                        <Form.Label style={{color:'#eee'}}>Usuario</Form.Label>
                        <Form.Control 
                            type="text" 
                            placeholder="Usuario" 
                            value={username} 
                            onChange={e => setUsername(e.target.value)} 
                            style={{background:'#232526', color:'#fff', border:'none', borderRadius:8, marginBottom:10}}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="formBasicPassword">
                        <Form.Label style={{color:'#eee'}}>Contraseña</Form.Label>
                        <Form.Control 
                            type="password" 
                            placeholder="Contraseña" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            style={{background:'#232526', color:'#fff', border:'none', borderRadius:8, marginBottom:10}}
                        />
                    </Form.Group>
                    <Button 
                        variant="primary" 
                        type="submit" 
                        className="w-100 mb-2" 
                        style={{borderRadius:8, fontWeight:600, fontSize:'1.1em', padding:'0.7em 0'}}>
                        Entrar
                    </Button>
                    {error && <p style={{color:'#ff6b6b', textAlign:'center', marginTop:10}}>{error}</p>}
                </Form>
            </Container>
        </div>
    );
}

export default Login;