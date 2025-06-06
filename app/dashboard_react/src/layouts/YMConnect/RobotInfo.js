import React from 'react';
import { Container, Row, Col, Badge } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const robotStatus = {
  cycleMode: 1,
  isRunning: false,
  controlMode: 0,
  isInHold: false,
  isAlarming: false,
  isErroring: false,
  isServoOn: false,
};

const labels = {
  cycleMode: 'Cycle Mode',
  isRunning: 'Running',
  controlMode: 'Control Mode',
  isInHold: 'In Hold',
  isAlarming: 'Alarming',
  isErroring: 'Erroring',
  isServoOn: 'Servo On',
};

const valueDisplay = (key, value) => {
  if (typeof value === 'boolean') {
    return (
      <Badge
        pill
        style={{
          background: value ? '#8fffa0' : '#ff5a5a',
          color: value ? '#1a3d1a' : '#fff',
          fontWeight: 700,
          fontSize: 18,
          minWidth: 90,
          padding: '8px 22px',
          borderRadius: 32,
          border: '2px solid #2222',
          boxShadow: '0 2px 8px #0001',
          fontFamily: 'Montserrat, Arial, sans-serif',
          textShadow: value ? '0 1px 2px #fff8' : '0 1px 2px #0008',
          letterSpacing: 1,
        }}
      >
        {value ? 'Yes' : 'No'}
      </Badge>
    );
  }
  if (key === 'cycleMode') {
    return value === 1 ? 'Auto' : value === 0 ? 'Manual' : value;
  }
  if (key === 'controlMode') {
    return value === 0 ? 'Remote' : value === 1 ? 'Local' : value;
  }
  return value;
};

const RobotInfo = () => {
  return (
    <div style={{
      width: '100%',  // Hace que ocupe todo el ancho disponible
      height: '100vh',  // Hace que ocupe toda la altura de la pantalla
      background: '#fff',
      padding: '20px', // Espaciado para asegurar que no esté pegado a los bordes
    }}>
      <Container style={{
        maxWidth: 700,
        width: '100%', // Asegura que el contenido ocupe el 100% del ancho disponible hasta el máximo
        background: '#f7faff',
        borderRadius: 18,
        boxShadow: '0 2px 12px #0033660a',
        padding: '40px 40px',
        fontFamily: 'Montserrat, Inter, Arial, sans-serif',
      }}>
        <h2 style={{
          color: '#1976d2',
          fontWeight: 900,
          fontSize: '2.1em',
          letterSpacing: 1,
          marginBottom: 32,
          textAlign: 'center',
        }}>Robot Status</h2>
        {Object.entries(robotStatus).map(([key, value]) => (
          <Row key={key} className="align-items-center mb-3" style={{ borderBottom: '1px solid #e3e8f7', paddingBottom: 12 }}>
            <Col xs={6} style={{ fontWeight: 700, fontSize: 20, color: '#1976d2', textAlign: 'left', letterSpacing: 1 }}>
              {labels[key]}
            </Col>
            <Col xs={6} style={{ fontWeight: 700, fontSize: 20, color: '#222', textAlign: 'right' }}>
              {valueDisplay(key, value)}
            </Col>
          </Row>
        ))}
      </Container>
    </div>
  );
};

export default RobotInfo;

