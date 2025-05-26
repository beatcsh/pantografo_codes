import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col } from 'react-bootstrap';
import LoginForm from '../components/LoginForm';

const Login = () => {
    return (
        <>
            <Container>
                <Row>
                    <Col>
                        <LoginForm/>
                    </Col>
                </Row>
            </Container>
        </>
    );
}

export default Login;