import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const DashboardHome = () => {
  const [hover, setHover] = useState(null); // 'left' | 'right' | null
  const [animating, setAnimating] = useState(null); // 'left' | 'right' | null
  const navigate = useNavigate();

  // Maneja el click con animación
  const handleClick = (side) => {
    setAnimating(side);
    setTimeout(() => {
      if (side === 'left') navigate('/ymconnect');
      if (side === 'right') navigate('/converter');
    }, 650); // Duración de la animación de expansión
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      position: 'relative',
      fontFamily: 'Montserrat, Inter, Arial, sans-serif',
      background: '#fff',
      overflow: 'hidden',
      display: 'flex',
    }}>
      {/* Lado izquierdo: robots */}
      <div
        onMouseEnter={() => setHover('left')}
        onMouseLeave={() => setHover(null)}
        onClick={() => !animating && handleClick('left')}
        style={{
          width: '100vw',
          minWidth: 0,
          height: '100vh',
          position: 'absolute',
          top: 0,
          left: 0,
          cursor: animating ? 'default' : 'pointer',
          zIndex: 2,
          transition: 'box-shadow 0.3s, filter 0.3s',
          boxShadow: hover === 'left' ? '0 0 40px 0 #0050c8cc' : 'none',
          clipPath: 'polygon(0 0, 58vw 0, 48vw 100vh, 0 100vh)',
          overflow: 'hidden',
          pointerEvents: animating && animating !== 'left' ? 'none' : 'auto',
        }}
      >
        <img
          src={process.env.PUBLIC_URL + '/assets/Imagen_robots.jpeg'}
          alt="robots"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'brightness(0.7) grayscale(0.1)',
            opacity: 0.85,
            transition: 'all 0.35s cubic-bezier(.4,2,.3,1)',
            transform: hover === 'left' ? 'scale(1.04)' : 'scale(1)',
          }}
        />
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(180deg, #0050c8cc 0%, #003366cc 100%)',
          zIndex: 1,
        }} />
        <div style={{
          position: 'absolute',
          top: 48,
          left: 48,
          zIndex: 2,
        }}>
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: '2.5em', letterSpacing: 1 }}>YMCONNECT</h1>
          <div style={{ color: '#e0e6f7', fontWeight: 400, fontSize: 22, marginTop: 8, maxWidth: 420 }}>
            This section allows you to see<br />the robot's data, as well as its status.
          </div>
        </div>
        <div style={{ position: 'absolute', left: 32, bottom: 24, color: '#fff', fontWeight: 900, fontSize: 22, letterSpacing: 1, zIndex: 2 }}>YASKAWA</div>
      </div>

      {/* Lado derecho: código */}
      <div
        onMouseEnter={() => setHover('right')}
        onMouseLeave={() => setHover(null)}
        onClick={() => !animating && handleClick('right')}
        style={{
          width: '100vw',
          minWidth: 0,
          height: '100vh',
          position: 'absolute',
          top: 0,
          left: 0,
          cursor: animating ? 'default' : 'pointer',
          zIndex: 1,
          clipPath: 'polygon(58vw 0, 100vw 0, 100vw 100vh, 48vw 100vh)',
          overflow: 'hidden',
          boxShadow: hover === 'right' ? '0 0 40px 0 #0050c8cc' : 'none',
          pointerEvents: animating && animating !== 'right' ? 'none' : 'auto',
        }}
      >
        <img
          src={process.env.PUBLIC_URL + '/assets/Imagen_codigo.jpeg'}
          alt="codigo"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'brightness(0.85) grayscale(0.1)',
            opacity: 0.82,
            transition: 'all 0.35s cubic-bezier(.4,2,.3,1)',
            transform: hover === 'right' ? 'scale(1.04)' : 'scale(1)',
          }}
        />
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(255,255,255,0.82)',
          zIndex: 1,
        }} />
        <div style={{
          position: 'absolute',
          bottom: 48,
          right: 64,
          zIndex: 2,
          textAlign: 'right',
        }}>
          <h1 style={{ color: '#0066cc', fontWeight: 900, fontSize: '2.2em', letterSpacing: 1 }}>CONVERTER</h1>
          <div style={{ color: '#222', fontWeight: 400, fontSize: 18, marginTop: 8, maxWidth: 420 }}>
            It is an application that allows the<br />conversion of .dxf files to inform II language.
          </div>
        </div>
      </div>

      {/* Overlay animado de expansión */}
      {animating && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 99,
            pointerEvents: 'none',
            background: animating === 'left'
              ? 'linear-gradient(180deg, #0050c8cc 0%, #003366cc 100%)'
              : 'rgba(255,255,255,0.82)',
            animation: `${animating === 'left' ? 'expandLeft' : 'expandRight'} 0.65s cubic-bezier(.4,2,.3,1) forwards`,
          }}
        />
      )}

      {/* Animaciones keyframes globales */}
      <style>{`
        @keyframes expandLeft {
          0% {
            clip-path: polygon(0 0, 58vw 0, 48vw 100vh, 0 100vh);
            opacity: 1;
          }
          80% {
            clip-path: polygon(0 0, 100vw 0, 100vw 100vh, 0 100vh);
            opacity: 1;
          }
          100% {
            clip-path: polygon(0 0, 100vw 0, 100vw 100vh, 0 100vh);
            opacity: 1;
          }
        }
        @keyframes expandRight {
          0% {
            clip-path: polygon(58vw 0, 100vw 0, 100vw 100vh, 48vw 100vh);
            opacity: 1;
          }
          80% {
            clip-path: polygon(0 0, 100vw 0, 100vw 100vh, 0 100vh);
            opacity: 1;
          }
          100% {
            clip-path: polygon(0 0, 100vw 0, 100vw 100vh, 0 100vh);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardHome;