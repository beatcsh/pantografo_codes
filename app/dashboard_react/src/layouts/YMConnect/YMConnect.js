import React, { useState } from 'react';
import StatsRobot from '../StatsRobot';
import Alarms from './Alarms';
import JobList from './JobList';
import Diagnostics from './Diagnostics';
import RobotInfo from './RobotInfo';
import AboutUs from './AboutUs';
import { FaHome, FaBell, FaList, FaChartLine, FaRobot, FaInfoCircle } from 'react-icons/fa';

const menu = [
  { key: 'home', label: 'Home', icon: <FaHome size={22} />, component: <StatsRobot /> },
  { key: 'alarms', label: 'Alarms', icon: <FaBell size={22} />, component: <Alarms /> },
  { key: 'joblist', label: 'Job List', icon: <FaList size={22} />, component: <JobList /> },
  { key: 'diagnostics', label: 'Diagnostics', icon: <FaChartLine size={22} />, component: <Diagnostics /> },
  { key: 'robotinfo', label: 'Robot Info', icon: <FaRobot size={22} />, component: <RobotInfo /> },
  { key: 'aboutus', label: 'About Us', icon: <FaInfoCircle size={22} />, component: <AboutUs /> },
];

const YMConnect = (props) => {
  const { onContentReady } = props;
  const [active, setActive] = useState('home');
  const sidebarWidth = 290;

  // Llama a onContentReady al montar (puedes mejorar para esperar datos reales)
  React.useEffect(() => {
    if (onContentReady) onContentReady();
  }, [onContentReady]);

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      overflow: 'hidden',
      position: 'relative',
      background: `url('/assets/fondoHomeYM.png') center center/cover no-repeat fixed`,
    }}>
      {/* Overlay oscuro sobre todo el fondo */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 1,
        pointerEvents: 'none',
      }} />
      {/* Sidebar */}
      <div style={{
        width: sidebarWidth,
        background: '#fff',
        boxShadow: '2px 0 24px #0001',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: '0 0 0 0',
        zIndex: 10,
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        height: '100vh',
        borderTopLeftRadius: 16,
        borderBottomLeftRadius: 16,
        backgroundClip: 'padding-box',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}>
        <div style={{fontWeight:900, fontSize:'2.2em', color:'#1976d2', letterSpacing:1, margin:'38px 0 32px 32px', fontFamily:'Arial Black'}}>YASKAWA</div>
        <div style={{width:'100%'}}>
          {menu.map(item => (
            <button
              key={item.key}
              onClick={() => setActive(item.key)}
              style={{
                width: '90%',
                margin: '0 auto 10px auto',
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                fontSize: '1.25em',
                fontWeight: 600,
                color: active === item.key ? '#1976d2' : '#444',
                background: active === item.key ? '#e3edff' : 'transparent',
                border: 'none',
                borderRadius: 18,
                padding: '16px 24px',
                cursor: 'pointer',
                transition: 'all 0.18s',
                outline: 'none',
                boxShadow: active === item.key ? '0 4px 18px #1976d222' : 'none',
                textAlign: 'left',
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </div>
      {/* Main content */}
      <div style={{
        marginLeft: sidebarWidth,
        width: `calc(100vw - ${sidebarWidth}px)`,
        minHeight: '100vh',
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'margin-left 0.25s cubic-bezier(.4,2,.6,1), width 0.25s cubic-bezier(.4,2,.6,1)',
      }}>
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          {menu.find(m => m.key === active)?.component}
        </div>
      </div>
    </div>
  );
};

export default YMConnect;
