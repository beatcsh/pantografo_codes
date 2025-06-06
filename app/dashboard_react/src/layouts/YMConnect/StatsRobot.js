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
              Welcome. In this screen you will be able to see the robot statistics in real time and manipulate all the files.
              As an operator you can preview the JOBS before executing them and prepare the cell to avoid errors.
              Scroll down the menu on the left to see all the available options.
            </Card.Body>
          </Card>
          {/* <Image src="/assets/fondoHomeYM.png" style={{ width: '400px', margin: '30px' }} rounded /> */}
          {/* `url('/assets/fondoHomeYM.png') center center/cover no-repeat fixed` */}
        </Col>
      </Row>
    </Container>
  )
}

export default StatsRobot