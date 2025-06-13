import { Button, Spinner, Alert } from 'react-bootstrap';
import { FaTrashAlt } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import AOS from "aos"
import 'aos/dist/aos.css'

const API_URL = 'http://localhost:8000';

const FilesConverter = ({ setView, search, setSearch }) => {
    const [jobs, setJobs] = useState([]);
    const [jobsLoading, setJobsLoading] = useState(false);
    const [jobsError, setJobsError] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(null);

    // Cargar archivos JBI
    const fetchJobs = () => {
        setJobsLoading(true);
        fetch(`${API_URL}/listar-jobs`)
            .then(res => res.json())
            .then(data => {
                setJobs(Array.isArray(data) ? data : []);
                setJobsLoading(false);
            })
            .catch(() => {
                setJobs([]);
                setJobsLoading(false);
            });
    };
    useEffect(fetchJobs, []);

    useEffect(() => {
        AOS.init()
    }, [])

    // Eliminar archivo JBI
    const handleDelete = async (idx) => {
        setDeleteLoading(idx);
        try {
            const res = await fetch(`${API_URL}/borrar?idx=${idx}`, { method: 'DELETE' });
            if (res.ok) fetchJobs();
            else setJobsError('No se pudo eliminar el archivo.');
        } catch {
            setJobsError('Error de red al eliminar.');
        }
        setDeleteLoading(null);
    };

    return (
        <div data-aos="zoom-in-up" style={{
            background: '#f3f3f3',
            borderRadius: 16,
            padding: '32px 18px 24px 18px',
            maxWidth: 700,
            margin: '40px auto',
            boxShadow: '0 8px 32px 0 #0002',
            fontFamily: 'Arial, sans-serif',
            minHeight: 420,
        }}>
            <button
                onClick={() => setView('select')}
                style={{
                    background: '#1976d2',
                    color: '#fff',
                    fontWeight: 700,
                    fontFamily: 'Arial Black',
                    border: 'none',
                    borderRadius: 10,
                    padding: '10px 22px',
                    fontSize: '1.1em',
                    marginBottom: 18,
                    float: 'right',
                    cursor: 'pointer',
                    transition: 'background 0.18s',
                }}
                onMouseOver={e => e.currentTarget.style.background = '#0056b3'}
                onMouseOut={e => e.currentTarget.style.background = '#1976d2'}
            >
                ← Back
            </button>
            <div style={{ clear: 'both' }}></div>
            <div style={{ fontWeight: 900, fontSize: '2.1em', color: '#1976d2', letterSpacing: 1, marginBottom: 10, fontFamily: 'Arial Black, Arial, sans-serif', textAlign: 'left' }}>
                JBI FILES IN TO THE ROBOT
            </div>
            <input
                type="text"
                placeholder="SEARCH FILE . . ."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                    width: '100%',
                    maxWidth: 340,
                    marginBottom: 18,
                    borderRadius: 10,
                    border: '2px solid #bbb',
                    padding: '12px 18px',
                    fontSize: '1.15em',
                    fontWeight: 600,
                    color: '#222',
                    background: '#fff',
                    outline: 'none',
                    fontFamily: 'Arial, sans-serif',
                }}
            />
            <div style={{
                background: '#0073ff',
                borderRadius: '12px 12px 0 0',
                color: '#fff',
                fontWeight: 800,
                fontSize: '1.18em',
                display: 'flex',
                flexDirection: 'row',
                padding: '10px 0 10px 0',
                marginBottom: 0,
                letterSpacing: 1,
                fontFamily: 'Arial Black, Arial, sans-serif',
            }}>
                <div style={{ flex: '0 0 60px', textAlign: 'center' }}>ID</div>
                <div style={{ flex: 2, textAlign: 'center' }}>FILE NAME</div>
                <div style={{ flex: 1, textAlign: 'center' }}>ACTION</div>
            </div>
            <div style={{
                maxHeight: 320,
                overflowY: 'auto',
                background: '#f3f3f3',
                borderRadius: '0 0 12px 12px',
                boxShadow: '0 8px 18px 0 #0002',
            }}>
                {jobsLoading ? (
                    <div style={{ textAlign: 'center', padding: 30 }}><Spinner animation="border" /></div>
                ) : (
                    jobs.filter(j => j.toLowerCase().includes(search.toLowerCase())).map((j, i) => (
                        <div key={j} style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            borderBottom: '1px solid #e0e0e0',
                            fontSize: '1.25em',
                            fontFamily: 'Roboto Mono, Consolas, monospace',
                            color: '#222',
                            background: i % 2 === 0 ? '#fff' : '#f3f3f3',
                            padding: '0 0',
                            minHeight: 54,
                        }}>
                            <div style={{ flex: '0 0 60px', textAlign: 'center', fontWeight: 700 }}>{i + 1}</div>
                            <div style={{ flex: 2, textAlign: 'center', fontWeight: 700, letterSpacing: 1 }}>{j}</div>
                            <div style={{ flex: 1, textAlign: 'center' }}>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    style={{
                                        borderRadius: 10,
                                        fontWeight: 700,
                                        fontSize: '1.05em',
                                        background: '#ff2222',
                                        border: 'none',
                                        padding: '6px 12px',
                                        boxShadow: '0 2px 8px #0002',
                                        letterSpacing: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minWidth: 0,
                                        width: 38,
                                        height: 38,
                                        margin: '0 auto',
                                    }}
                                    disabled={deleteLoading === i}
                                    onClick={() => handleDelete(i)}
                                >
                                    {deleteLoading === i ? <Spinner size="sm" animation="border" /> : <FaTrashAlt size={20} />}
                                </Button>
                            </div>
                        </div>
                    ))
                )}
                {jobsError && <Alert variant="danger">{jobsError}</Alert>}
            </div>
        </div>
    )
}

export default FilesConverter