import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const dummyIO = [
  { num: 1, type: 'Input', active: false },
  { num: 2, type: 'Output', active: true },
  { num: 3, type: 'Output', active: false },
  { num: 4, type: 'Output', active: true },
  { num: 5, type: 'Input', active: false },
  { num: 6, type: 'Input', active: true },
];

const Diagnostics = () => {
  const [ioList, setIoList] = useState([]);

  useEffect(() => {
    setIoList(dummyIO);
  }, []);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center', // Centra horizontalmente
      alignItems: 'center', // Centra verticalmente
      width: '100%',
      minHeight: '100vh',
      padding: 32,
      backgroundColor: '#f4f4f8'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 900, // Máximo ancho para el contenido
        background: '#fff',
        borderRadius: 8,
        boxShadow: '0 2px 10px #0001',
        padding: 16,
      }}>
        <table style={{
          width: '100%',
          background: '#fff',
          borderRadius: 8,
          boxShadow: '0 2px 10px #0001'
        }}>
          <thead>
            <tr>
              <th style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: '#29a6ff',
                textAlign: 'center',
                padding: 16,
                borderBottom: '2px solid #eee',
                fontFamily: 'Montserrat, sans-serif'
              }}>
                Inputs/outputs
              </th>
              <th style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: '#29a6ff',
                textAlign: 'center',
                padding: 16,
                borderBottom: '2px solid #eee',
                fontFamily: 'Montserrat, sans-serif'
              }}>
                Number
              </th>
              <th style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: '#29a6ff',
                textAlign: 'center',
                padding: 16,
                borderBottom: '2px solid #eee',
                fontFamily: 'Montserrat, sans-serif'
              }}>
                Estado
              </th>
            </tr>
          </thead>
          <tbody>
            {ioList.map((io, idx) => (
              <tr key={idx}>
                <td style={{
                  textAlign: 'center',
                  padding: 16,
                  fontSize: 18,
                  fontWeight: 600,
                  fontFamily: 'Arial, sans-serif'
                }}>
                  {io.type}
                </td>
                <td style={{
                  textAlign: 'center',
                  padding: 16,
                  fontSize: 20,
                  fontWeight: 600,
                  fontFamily: 'Courier New, monospace',
                  letterSpacing: 2
                }}>
                  {'#'.repeat(20)}
                </td>
                <td style={{ textAlign: 'center', padding: 16 }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '8px 20px',
                    borderRadius: 999,
                    backgroundColor: io.active ? '#7CFC00' : '#FF4444',
                    color: io.active ? '#003300' : '#fff',
                    fontWeight: 'bold',
                    fontSize: 16,
                    fontFamily: 'Arial',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
                  }}>
                    {io.active ? 'Active' : 'Unabled'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Diagnostics;


