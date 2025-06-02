import logo from './logo.svg';
import './App.css';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from './layouts/Login';
import DashboardHome from './layouts/DashboardHome';
import StatsRobot from './layouts/StatsRobot';
import Converter from './layouts/Converter';
import ModernDashboard from './layouts/ModernDashboard';
import YMConnect from './layouts/YMConnect/YMConnect';
import { useEffect } from 'react';

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
          <Route path="/home" element={<DashboardHome />}></Route>
          <Route path="/stats" element={<StatsRobot />}></Route>
          <Route path="/converter" element={<Converter />}></Route>
          <Route path="/ModernDashboard" element={<ModernDashboard />}></Route>
          <Route path="/ymconnect" element={<YMConnect />}></Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
