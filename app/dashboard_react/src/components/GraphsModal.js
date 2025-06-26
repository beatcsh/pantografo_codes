import { Modal, Button } from "react-bootstrap"
import { MdAutoGraph } from "react-icons/md"

const GraphsModal = ({ show, close, data }) => {
    return (
        <Modal show={show} onHide={close} centered data-aos="zoom-in-up" >
            <Modal.Header closeButton>
                <Modal.Title><MdAutoGraph className="mb-1"/> Alarm Graphs</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {Array.isArray(data?.graphs) && data.graphs.length > 0 ? (
                    data.graphs.map((graph, idx) => (
                        <div key={idx} style={{ marginBottom: "1rem", textAlign: "center" }}>
                            <img
                                src={`data:image/png;base64,${graph.image}`}
                                alt={graph.title}
                                style={{ maxWidth: "100%", borderRadius: "10px", boxShadow: "0 0 10px rgba(0,0,0,0.1)" }}
                            />
                        </div>
                    ))
                ) : (
                    <p>No hay graficas we</p>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={close}>Close</Button>
            </Modal.Footer>
        </Modal>
    )
}

export default GraphsModal