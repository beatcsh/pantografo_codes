import { useNavigate } from "react-router-dom";
import { Button } from 'react-bootstrap';
import { FaHome } from "react-icons/fa";

const HomeButton = () => {
    const navigate = useNavigate();

    const goHome = () => {
        navigate("/home"); 
    };

    return (
        <Button 
            onClick={goHome}
            style={{
                position: 'fixed',
                top: 24,
                right: 21,
                zIndex: 9999,
                borderRadius: 8, 
                padding: 10,
                background: '#ffffff',
                border: '2px solid #1976d2',    
            }}
        >
            <FaHome color="#1876d3" size={20} />
        </Button>
    );
};

export default HomeButton;
