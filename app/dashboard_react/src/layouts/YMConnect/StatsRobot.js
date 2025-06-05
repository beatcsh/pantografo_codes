import { Container, Row, Image, Card, Col } from 'react-bootstrap'
import { useEffect } from 'react'
import AOS from "aos"
import 'aos/dist/aos.css'

const StatsRobot = () => {

  useEffect(() => {
    AOS.init()
  }, [])

  return (
    <Container data-aos="zoom-in-up" className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <Row className="text-center">
        <Col>
          <div style={{
            fontWeight: 900,
            fontSize: '45px',
            color: '#1976d2',
            letterSpacing: 1,
            marginBottom: '20px',
            fontFamily: 'Arial Black',
          }}>
            YMConnect Service
          </div>
          <Card style={{ background: 'rgb(1,9,35)', color: '#ffffff', padding: '20px', fontSize: '20px' }}>
            <Card.Body>
              Bienvenido. En esta pantalla podrás ver las estadísticas del robot en tiempo real y manipular todos los archivos.
              Siendo operario podras previsualizar los JOBS antes de ejecutarlos y preparar la celda para evitar errores.
              Despliega el menu de la izquierda para ver todas las opciones disponibles.
            </Card.Body>
          </Card>
          <Image src="/assets/fondoHomeYM.png" style={{ width: '400px', margin: '30px' }} rounded />
          {/* `url('/assets/fondoHomeYM.png') center center/cover no-repeat fixed` */}
        </Col>
      </Row>
    </Container>
  )
}

export default StatsRobot