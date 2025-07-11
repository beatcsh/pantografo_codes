import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { useEffect } from 'react';
import AOS from "aos"
import 'aos/dist/aos.css'

const ModalJob = ({ content, show, close }) => {

    useEffect(() => {
        AOS.init()
    }, [])

    if (!show) return null

    return (
        <Modal show={show} onHide={close} centered data-aos="zoom-in-up">
            <Modal.Header closeButton>
                <Modal.Title>Job Content</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <pre>{content}</pre>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={close}>Close</Button>
            </Modal.Footer>
        </Modal>
    )
}

export default ModalJob