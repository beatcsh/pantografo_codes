import { Card, Col, Row, Button } from 'react-bootstrap';

const CardsHome = () => {

    const info = [
        {
            id: 0,
            title: "Convertidor DxF a JBI",
            description: "Convierte archivos DxF y envíalos al equipo para comenzar a trabajar.",
            route: "/converter",
            image: "https://cdn.prod.website-files.com/5f5a53e153805db840dae2db/6458d604829148153fb7cd52_codigo-python-beautiful-soup.jpg"
        },
        {
            id: 1,
            title: "Conexión a Robot",
            description: "Ve en tiempo real el estado e información de tu equipo.",
            route: "/stats",
            image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSHDGkFxKzqfaHmXYDBwF1U7VOMm5cg2bExXA&s"
        }
    ];

    return (
        <Row className="justify-content-center">
            {info.map((card) => (
                <Col key={card.id} xs={12} sm={10} md={6} lg={4} className="mb-5 d-flex justify-content-center">
                    <Card bg="dark" style={{ width: '100%', maxWidth: '20rem', color: "#ffffff" }}>
                        <Card.Img
                            style={{ height: 200, objectFit: 'cover' }}
                            variant="top"
                            src={card.image}
                        />
                        <Card.Body>
                            <Card.Title>{card.title}</Card.Title>
                            <Card.Text>{card.description}</Card.Text>
                            <a href={card.route}><Button variant="primary">Ir a la página</Button></a>
                        </Card.Body>
                    </Card>
                </Col>
            ))}
        </Row>
    );
};

export default CardsHome;
