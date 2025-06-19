import { FaBell, FaList, FaChartLine, FaRobot, FaInfoCircle, FaTimes, FaBars } from 'react-icons/fa'
import { PiPlugsConnectedBold } from "react-icons/pi"
import HomeButton from '../../components/HomeButton'
import { useState, useEffect } from 'react'
import Diagnostics from './Diagnostics'
import StatsRobot from './StatsRobot'
import RobotInfo from './RobotInfo'
import AboutUs from './AboutUs'
import JobList from './JobList'
import Alarms from './Alarms'
import React from 'react'

const YMConnect = (props) => {
  const { onContentReady, robot_ip } = props
  const [active, setActive] = useState('home')
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const menu = [
    { key: 'home', label: 'Start', icon: <PiPlugsConnectedBold size={22} />, component: <StatsRobot robot_ip={robot_ip} /> },
    { key: 'joblist', label: 'Job List', icon: <FaList size={22} />, component: <JobList setActive={setActive} robot_ip={robot_ip} /> },
    { key: 'alarms', label: 'Alarms', icon: <FaBell size={22} />, component: <Alarms robot_ip={robot_ip} /> },
    { key: 'diagnostics', label: 'Diagnostics', icon: <FaChartLine size={22} />, component: <Diagnostics robot_ip={robot_ip} /> },
    { key: 'robotinfo', label: 'Robot Info', icon: <FaRobot size={22} />, component: <RobotInfo robot_ip={robot_ip} /> },
    { key: 'aboutus', label: 'About Us', icon: <FaInfoCircle size={22} />, component: <AboutUs /> },
  ]

  const handleResize = () => setIsMobile(window.innerWidth <= 768)

  useEffect(() => {
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const sidebarWidth = isMobile ? 240 : 321

  // Llama a onContentReady al montar (puedes mejorar para esperar datos reales)
  React.useEffect(() => {
    if (onContentReady) onContentReady()
  }, [onContentReady])

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      overflow: 'hidden',
      position: 'relative',
      background: 'rgb(1,9,35,255)'
    }}>
      <HomeButton/>

      {/* Botón menú (visible siempre para toggle sidebar) */}
      <button
        onClick={() => setSidebarOpen(prev => !prev)}
        style={{
          position: 'fixed',
          top: 20,
          left: sidebarOpen ? sidebarWidth + 20 : 20, // Mover al abrir sidebar
          zIndex: 2000,
          background: '#1976d2',
          border: 'none',
          borderRadius: 8,
          padding: 10,
          color: '#fff',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          transition: 'left 0.3s ease', // animación suave
        }}
        aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
      >
        {sidebarOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
      </button>

      {/* Sidebar flotante */}

      <div style={{
        width: sidebarWidth,
        background: '#fff',
        boxShadow: '2px 0 24px #0001',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 0,
        zIndex: 1500,
        position: 'fixed',
        left: sidebarOpen ? 0 : -sidebarWidth,
        top: 0,
        bottom: 0,
        height: '100vh',
        transition: 'left 0.3s ease-in-out',
        borderTopRightRadius: isMobile ? 16 : 0,
        borderBottomRightRadius: isMobile ? 16 : 0,
        overflowY: 'auto',
      }}>
        <img src='../assets/yaskawa.png' alt='logo' style={{
          width: '180px',
          margin: '40px 40px 40px 20px',
          fontWeight: 900,
          fontSize: '2em',
          color: '#1976d2',
          letterSpacing: 1,
          fontFamily: 'Arial Black',
        }} />
        <div style={{ width: '100%' }}>
          {menu.map(item => (
            <button
              key={item.key}
              onClick={() => {
                setActive(item.key)
                setSidebarOpen(prev => !prev)
              }}
              style={{
                width: '90%',
                margin: '0 auto 10px auto',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                fontSize: '1.15em',
                fontWeight: 600,
                color: active === item.key ? '#1976d2' : '#444',
                background: active === item.key ? '#e3edff' : 'transparent',
                border: 'none',
                borderRadius: 18,
                padding: '14px 20px',
                cursor: 'pointer',
                transition: 'all 0.18s',
                textAlign: 'left',
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main content siempre full screen y debajo de sidebar */}
      <div style={{
        position: 'relative',
        zIndex: 100,
        width: '100vw',
        height: '100vh',
        overflow: 'auto',
        boxSizing: 'border-box',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: 'url("../assets/bg.jpeg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}>
        {menu.find(m => m.key === active)?.component}
      </div>
    </div>
  )
}

export default YMConnect