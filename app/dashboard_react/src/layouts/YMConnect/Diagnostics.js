import React, { useState, useEffect } from 'react';

// Dummy data para ejemplo (puedes reemplazar por fetch a API real)
const dummyIO = [
  { num: 1, type: 'Input', active: true },
  { num: 2, type: 'Input', active: false },
  { num: 3, type: 'Input', active: true },
  { num: 4, type: 'Input', active: false },
  { num: 5, type: 'Output', active: true },
  { num: 6, type: 'Output', active: false },
  { num: 7, type: 'Output', active: false },
  { num: 8, type: 'Output', active: true },
];

const Diagnostics = () => {
  const [ioList, setIoList] = useState([]);

  useEffect(() => {
    setIoList(dummyIO);
  }, []);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#fff',
      margin: 0,
      padding: 0,
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
    }}>
      <div style={{
        marginLeft: 290, // igual al ancho de la sidebar
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '0 24px',
      }}>
        <h2 style={{
          color: '#1976d2',
          fontWeight: 900,
          fontSize: '2.1em',
          letterSpacing: 1,
          margin: '0 0 32px 0',
          textAlign: 'left',
          fontFamily: 'Montserrat, Inter, Arial, sans-serif',
        }}>Entradas y Salidas</h2>
        <div style={{
          maxWidth: 600,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          maxHeight: '70vh',
          overflowY: 'auto',
        }}>
          {ioList.map((io) => (
            <div key={io.num} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f7faff',
              borderRadius: 16,
              boxShadow: '0 2px 12px #0033660a',
              padding: '18px 28px',
              fontFamily: 'Montserrat, Inter, Arial, sans-serif',
              fontWeight: 600,
              fontSize: 18,
              color: '#222',
              letterSpacing: 0.5,
            }}>
              <span style={{ color: '#1976d2', fontWeight: 900, fontSize: 20, minWidth: 40 }}>#{io.num}</span>
              <span style={{ color: io.type === 'Input' ? '#1976d2' : '#ffb300', fontWeight: 700, fontSize: 18, minWidth: 90, textAlign: 'center' }}>
                {io.type === 'Input' ? 'Entrada' : 'Salida'}
              </span>
              <span style={{
                display: 'inline-block',
                minWidth: 110,
                padding: '8px 22px',
                borderRadius: 18,
                fontWeight: 800,
                fontSize: 16,
                background: io.active ? 'linear-gradient(90deg,#43ea7a 0%,#1de982 100%)' : 'linear-gradient(90deg,#ff5252 0%,#ff1744 100%)',
                color: '#fff',
                boxShadow: io.active ? '0 2px 8px #43ea7a33' : '0 2px 8px #ff525233',
                letterSpacing: 1,
                border: 'none',
                transition: 'background 0.2s',
                textShadow: '0 1px 4px #0001',
                textAlign: 'center',
              }}>
                {io.active ? 'ACTIVA' : 'INACTIVA'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Diagnostics;
