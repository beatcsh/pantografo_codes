import React from 'react';
import { FaDownload } from 'react-icons/fa';

const jobs = Array(8).fill({
  name: 'ExampleNameJob.JBI',
  download: true,
  start: true,
  stop: true,
});

const JobList = () => (
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
      }}>Job List</span>
      <span style={{
        background: '#fff',
        border: '1.5px solid #aaa',
        borderRadius: 6,
        fontWeight: 600,
        fontSize: '1.1em',
        padding: '6px 22px',
        marginLeft: 18,
        color: '#444',
        boxShadow: '0 2px 8px #0001',
      }}>32 active jobs</span>
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
      overflowX: 'auto',
      overflowY: 'auto',
      maxHeight: 480,
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
            <th style={{padding: '8px 0', textAlign:'left'}}>Job name</th>
            <th style={{padding: '8px 0', textAlign:'center'}}>download</th>
            <th style={{padding: '8px 0', textAlign:'center'}}>start</th>
            <th style={{padding: '8px 0', textAlign:'center'}}>stop</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job, i) => (
            <tr key={i} style={{height:48}}>
              <td style={{textAlign:'left'}}>{job.name}</td>
              <td style={{textAlign:'center'}}>
                <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:2}}>
                  <span style={{fontSize:'0.95em', color:'#888'}}>download</span>
                  <button style={{
                    background:'#444d5c',
                    border:'none',
                    borderRadius: '50%',
                    width:36,
                    height:36,
                    display:'flex',
                    alignItems:'center',
                    justifyContent:'center',
                    boxShadow:'0 2px 8px #0002',
                    cursor:'pointer',
                  }}>
                    <FaDownload color="#fff" size={18} />
                  </button>
                </div>
              </td>
              <td style={{textAlign:'center'}}>
                <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:2}}>
                  <span style={{fontSize:'0.95em', color:'#888'}}>start</span>
                  <span style={{
                    background:'#2ecc40',
                    color:'#fff',
                    borderRadius:'50%',
                    width:32,
                    height:32,
                    display:'flex',
                    alignItems:'center',
                    justifyContent:'center',
                    fontSize:'1.4em',
                    fontWeight:700,
                  }}>✓</span>
                </div>
              </td>
              <td style={{textAlign:'center'}}>
                <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:2}}>
                  <span style={{fontSize:'0.95em', color:'#888'}}>stop</span>
                  <span style={{
                    background:'#ff2d2d',
                    color:'#fff',
                    borderRadius:'50%',
                    width:32,
                    height:32,
                    display:'flex',
                    alignItems:'center',
                    justifyContent:'center',
                    fontSize:'1.4em',
                    fontWeight:700,
                  }}>✕</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default JobList;
