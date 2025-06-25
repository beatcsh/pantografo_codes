import { Container } from 'react-bootstrap';

const AboutUs = () => {
  return (
    <Container
      data-aos="zoom-in"
      style={{
        minHeight: '100vh',
        background: 'transparent',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <img
        src="/assets/white_yaskawa.png"
        alt="Yaskawa Logo"
        style={{ maxWidth: 300, marginBottom: 32, marginTop: 32 }}
      />
      <div style={{ maxWidth: 700, fontSize: 20, color: "#222", background: "rgba(255,255,255,0.95)", borderRadius: 16, padding: 32, boxShadow: "0 2px 16px #009fe344" }}>
        Yaskawa, a leader in industrial automation solutions, is proud to present this platform developed by an interdisciplinary team of interns from universities in Aguascalientes, Mexico. Thanks to their dedication and the capabilities of the proprietary YM Connect technology, this platform offers advanced features for real-time monitoring and control of Yaskawa robots. This project is a testament to Yaskawa's commitment to innovation and the development of new talent in the field of engineering and automation.
      </div>
    </Container>
  );
};

export default AboutUs;