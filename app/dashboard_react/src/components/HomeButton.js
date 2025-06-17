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
                top: 21,
                right: 21,
                zIndex: 9999,
                borderRadius: 8, 
                padding: 10,
                background: '#ffffff'    
            }}
        >
            <FaHome color="#1876d3" size={20} />
        </Button>
    );
};

export default HomeButton;
