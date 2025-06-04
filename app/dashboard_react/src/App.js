import logo from './logo.svg';
import './App.css';
import React, { useEffect, useState, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Login from './layouts/Login';
import DashboardHome from './layouts/DashboardHome';
import StatsRobot from './layouts/StatsRobot';
import Converter from './layouts/Converter';
import ModernDashboard from './layouts/ModernDashboard';
import YMConnect from './layouts/YMConnect/YMConnect';

const PageTransitionWrapper = ({ children }) => {
  const [reveal, setReveal] = useState(false);
  const [contentReady, setContentReady] = useState(false);

  // Cuando el contenido esté listo, inicia la animación de agujero
  useEffect(() => {
    if (contentReady) {
      setTimeout(() => setReveal(true), 60);
    }
  }, [contentReady]);

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      zIndex: 100,
      background: '#fff',
    }}>
      {/* Overlay blanco que se va abriendo */}
      {!reveal && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: '#fff',
            zIndex: 101,
            pointerEvents: 'none',
            animation: contentReady ? 'revealHole 0.7s cubic-bezier(.4,2,.3,1) forwards' : 'none',
          }}
        />
      )}
      {/* El contenido solo se muestra cuando el overlay ya está animando */}
      <div style={{ position: 'relative', zIndex: 102, opacity: reveal ? 1 : 0, transition: 'opacity 0.2s 0.5s' }}>
        <Suspense fallback={<div style={{width:'100vw',height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'2em',color:'#1976d2'}}>Cargando...</div>}>
          {React.cloneElement(children, { onContentReady: () => setContentReady(true) })}
        </Suspense>
      </div>
      <style>{`
        @keyframes revealHole {
          0% {
            clip-path: circle(0% at 50% 50%);
            opacity: 1;
          }
          80% {
            clip-path: circle(120% at 50% 50%);
            opacity: 1;
          }
          100% {
            clip-path: circle(150% at 50% 50%);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

function App() {
  // Llama al API de la tabla al cargar la app para debug/chequeo
  useEffect(() => {
    fetch('http://localhost:8000/tabla')
      .then(async res => {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          console.log('Tabla de parámetros:', data);
        } catch (e) {
          console.error('Respuesta no es JSON válido:', text);
        }
      })
      .catch(err => {
        console.error('Error al llamar /tabla:', err);
      });
  }, []);

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />}></Route>
          <Route path="/home" element={<DashboardHomeWithTransition />} />
          <Route path="/stats" element={<StatsRobot />} />
          <Route path="/converter" element={<PageTransitionWrapper><Converter /></PageTransitionWrapper>} />
          <Route path="/ModernDashboard" element={<ModernDashboard />} />
          <Route path="/ymconnect" element={<PageTransitionWrapper><YMConnect /></PageTransitionWrapper>} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

// Envolver DashboardHome para que la animación de salida no tape la home
const DashboardHomeWithTransition = (props) => {
  return <DashboardHome {...props} />;
};

export default App;
