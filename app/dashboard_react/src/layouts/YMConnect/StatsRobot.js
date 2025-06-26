import { Container, Row, Card, Col } from "react-bootstrap"
import { useEffect } from "react"
import "aos/dist/aos.css"
import AOS from "aos"

const StatsRobot = ({ robot_ip }) => {
  const description = `🤖 Welcome to the Robot Dashboard!  
Here, you can access detailed robot statistics 📊 and manage all related files 📁 efficiently.  
As an operator 🧑‍💼, you'll be equipped with tools to evaluate process risks ⚠️ using system data.  
📂 Use the main menu on the left to explore all sections of the dashboard and streamline your workflow 🚀.`;

  useEffect(() => {
    AOS.init()
  }, [])

  return (
    <Container data-aos="zoom-in-up" className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <Row className="text-center">
        <Col>
          <img alt="ymconnect" src='../assets/white_ymconnect.png' style={{ width: '400px' }} />
          <hr />
          <Card style={{ background: 'rgb(1,9,35)', color: '#ffffff', padding: '20px', fontSize: '20px' }}>
            <Card.Body>
              <Card.Title><h2>Welcome!</h2></Card.Title>
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                {description}
              </pre>
            </Card.Body>
          </Card>
          
        </Col>
      </Row>
    </Container>
  )
}

export default StatsRobot