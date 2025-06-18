import { Container } from 'react-bootstrap';

const AboutUs = () => {
  return (
    <Container
      data-aos="zoom-in"
      style={{
        maxWidth: '800px',
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        padding: '40px 30px',
        margin: '20px'
      }}
    >
      <img src='https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSXKBfU75LuCKfGFnXJtqoYT-_AhPOL0x0tkA&s' alt='ola'/>
    </Container>
  )
};

export default AboutUs;
