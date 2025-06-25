import { Container, Accordion } from 'react-bootstrap';

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
        style={{ maxWidth: 330, marginBottom: 32, marginTop: 32 }}
      />
      <div style={{ maxWidth: 700, color: "#222", background: "#ffffff", borderRadius: 16, padding: 32, boxShadow: "0 2px 16px #009fe344" }}>
        <p style={{ fontSize: 19, textAlign: 'justify' }}>Yaskawa, a leader in industrial automation solutions, is proud to present this platform developed by an interdisciplinary team of interns from universities in Aguascalientes, Mexico. Thanks to their dedication and the capabilities of the proprietary YM Connect technology, this platform offers advanced features for real-time monitoring and control of Yaskawa robots. This project is a testament to Yaskawa's commitment to innovation and the development of new talent in the field of engineering and automation.</p>
        <Accordion>
          <Accordion.Item eventKey="0">
            <Accordion.Header>Company Information</Accordion.Header>
            <Accordion.Body>
              <div className='mt-4' style={{ fontSize: 16, textAlign: 'justify' }}>
                <img alt='logo yaskawa' src='../assets/yaskawa.png' style={{ width: '170px' }} className='mb-4' />
                <h6>Address</h6>
                <p>Cto. Aguascalientes Sur Lote Oriente 132, Parque industrial de Valle de Aguascalientes, 20358 Aguascalientes, Ags.</p>
                <h6>Contact</h6>
                <ul>
                  <li>Yaskawa México S.A. de C.V.</li>
                  <li>Phone number: 449-973-11-70  ||  449-973-11-71</li>
                  <li>Web site: <a href='https://www.yaskawamexico.com.mx/'>Yaskawa</a></li>
                </ul>
              </div>
            </Accordion.Body>
          </Accordion.Item>
          <Accordion.Item eventKey="1">
            <Accordion.Header>Universities Involved</Accordion.Header>
            <Accordion.Body>
              <div className='mt-4'>
                <img style={{ width: "288px" }} alt='upa logo' src="../assets/unis/upa.png" />
                <img style={{ width: "330px" }} alt='utma logo' src="../assets/unis/utma.png" />
                <img style={{ width: "150px" }} alt='uta logo' src="../assets/unis/uta.png" />
              </div>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </div>
      {/*  */}
    </Container>
  );
};

export default AboutUs;