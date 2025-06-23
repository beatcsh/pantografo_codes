import { Container, Spinner } from 'react-bootstrap';

const AboutUs = () => {
  return (
    <Container
      data-aos="zoom-in"
      style={{
        minHeight: '100vh',
        background: 'transparent',
        textAlign: 'center'
      }}
    >
      <img src='https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSXKBfU75LuCKfGFnXJtqoYT-_AhPOL0x0tkA&s' alt='ola' />
      <Spinner animation="border" role="status">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
    </Container>
  )
};

export default AboutUs;
