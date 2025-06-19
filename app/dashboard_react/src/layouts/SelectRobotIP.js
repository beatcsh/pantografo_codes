import React, { useState } from "react";
import { Button, Form, InputGroup, Alert, Container, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content"

const STATIC_IPS = [
  "192.168.1.31",
  "192.168.1.30"
];

const MySwal = withReactContent(Swal)
const YASKAWA_BLUE = "#009fe3";

const SelectRobotIP = ({ userType }) => {
  const [selectedIP, setSelectedIP] = useState("");
  const [customIP, setCustomIP] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, variant: "", message: "" });
  const navigate = useNavigate();

  const handleStaticIP = (ip) => {
    setSelectedIP(ip);
    setCustomIP("");
  };

  const handleCustomIP = (e) => {
    setCustomIP(e.target.value);
    if (selectedIP) setSelectedIP("");
  };

  const handleCheckConnection = async () => {
    const ip = selectedIP || customIP;
    if (!ip) {
      Swal.fire({
        icon: "warning",
        title: "IP not selected",
        text: "Please select a predefined IP or enter one."
      })
      return;
    }
    setLoading(true);
    
    try {
      await axios.get(`http://localhost:5229/Robot/status`, { params: { robot_ip: ip } });
      Swal.fire({
        icon: "success",
        title: "Successful connection",
        text: `Connected to the robot at the IP ${ip}`,
        timer: 5000,
      })
      setTimeout(() => {
        localStorage.setItem("robot_ip", ip);
        console.log("userType:", userType); // Para depuración
        if (userType && userType.toLowerCase() === "admin") {
          navigate("/home");
        } else {
          navigate("/ymconnect");
        }
      }, 900);
    } catch {
      MySwal.fire({
        icon: "error",
        title: "Lost conexion.",
        text: `Could not connect to the robot at the IP ${ip}. Check the connection and the entered IP.`,
        timer: 10000,
        showConfirmButton: false
      });
      setSelectedIP("");
      setCustomIP("");
    }
    setLoading(false);
  };

  return (
    <Container fluid style={{ minHeight: "100vh", background: "#f7fafd" }}>
      <Row style={{ background: YASKAWA_BLUE, height: 200, marginBottom: 0 }} />
      <Row className="justify-content-center align-items-center" style={{ minHeight: "calc(100vh - 200px)" }}>
        <Col xs={12} md={8} lg={6}>
          <div style={{ marginBottom: 32, textAlign: "center" }}>
            <h2 style={{ color: YASKAWA_BLUE, fontWeight: 800, letterSpacing: 1 }}>Select or enter the robot's IP.</h2>
            <p style={{ color: "#333", fontWeight: 500 }}>Choose a predefined IP or enter a custom one to connect to the robot</p>
          </div>
          <div style={{ display: "flex", gap: 24, justifyContent: "center", marginBottom: 28 }}>
            {STATIC_IPS.map(ip => (
              <Button
                key={ip}
                variant={selectedIP === ip ? "primary" : "outline-primary"}
                style={{
                  minWidth: 220,
                  minHeight: 60,
                  fontSize: 22,
                  fontWeight: 700,
                  borderRadius: 12,
                  borderWidth: 2,
                  background: selectedIP === ip ? YASKAWA_BLUE : "#fff",
                  color: selectedIP === ip ? "#fff" : YASKAWA_BLUE,
                  borderColor: YASKAWA_BLUE,
                  transition: "all 0.2s"
                }}
                onClick={() => handleStaticIP(ip)}
                disabled={loading}
              >
                {ip}
              </Button>
            ))}
          </div>
          <InputGroup className="mb-4" style={{ maxWidth: 500, margin: "0 auto" }}>
            <Form.Control
              type="text"
              placeholder="Or enter a custom IP."
              value={customIP}
              onChange={handleCustomIP}
              style={{
                fontSize: 20,
                borderRadius: 10,
                borderColor: YASKAWA_BLUE,
                background: "#fff"
              }}
              disabled={loading}
            />
          </InputGroup>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
            <Button
              onClick={handleCheckConnection}
              style={{
                minWidth: 220,
                minHeight: 60,
                fontSize: 22,
                fontWeight: 700,
                borderRadius: 12,
                background: YASKAWA_BLUE,
                borderColor: YASKAWA_BLUE,
                color: "#fff",
                boxShadow: "0 2px 12px #009fe344"
              }}
              disabled={loading}
            >
              {loading ? "Checking..." : "Check connection"}
            </Button>
          </div>
          {alert.show && (
            <Alert variant={alert.variant} style={{ textAlign: "center", fontSize: 18 }}>
              {alert.message}
            </Alert>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default SelectRobotIP;