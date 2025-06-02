import React from 'react';

const alarms = Array(8).fill({
  name: 'alarm_example',
  code: 'alarm_example_code 02941',
  subcode: 'alarm_example',
  date: 'alarm_example',
  action: 'Active',
});

const Alarms = () => (
  <div style={{
    width: '100%',
    minHeight: '100vh',
    background: '#f3f3f3',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: '0',
  }}>
    <div style={{
      width: '100%',
      padding: '48px 0 0 60px',
      display: 'flex',
      alignItems: 'center',
      gap: '18px',
    }}>
      <span style={{
        fontSize: '2.3em',
        fontWeight: 700,
        color: '#1976d2',
        fontFamily: 'Arial Black',
        letterSpacing: 1,
      }}>Alarms</span>
      <button style={{
        background: '#1976d2',
        color: '#fff',
        border: 'none',
        borderRadius: 18,
        fontWeight: 600,
        fontSize: '1em',
        padding: '6px 22px',
        marginLeft: 8,
        cursor: 'pointer',
        boxShadow: '0 2px 8px #1976d222',
        outline: 'none',
        transition: 'background 0.18s',
      }}>Reset</button>
    </div>
    <div style={{
      width: '90%',
      margin: '32px auto 0 60px',
      background: '#fff',
      borderRadius: 18,
      boxShadow: '0 4px 24px #0001',
      padding: '32px 0',
      minHeight: 420,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <table style={{
        width: '96%',
        borderCollapse: 'collapse',
        fontSize: '1.13em',
        fontFamily: 'Inter, Arial, sans-serif',
        color: '#222',
      }}>
        <thead>
          <tr style={{fontWeight:700, fontSize:'1.08em'}}>
            <th style={{padding: '8px 0'}}>alarm name</th>
            <th style={{padding: '8px 0'}}>code</th>
            <th style={{padding: '8px 0'}}>subcode</th>
            <th style={{padding: '8px 0'}}>date</th>
            <th style={{padding: '8px 0'}}>action</th>
          </tr>
        </thead>
        <tbody>
          {alarms.map((alarm, i) => (
            <tr key={i} style={{textAlign:'center', height:48}}>
              <td>{alarm.name}</td>
              <td>{alarm.code}</td>
              <td>{alarm.subcode}</td>
              <td>{alarm.date}</td>
              <td>
                <span style={{
                  background: '#00d100',
                  color: '#fff',
                  borderRadius: 6,
                  padding: '4px 18px',
                  fontWeight: 700,
                  fontSize: '1em',
                  display: 'inline-block',
                  boxShadow: '0 2px 8px #00d10033',
                }}>
                  {alarm.action}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default Alarms;
