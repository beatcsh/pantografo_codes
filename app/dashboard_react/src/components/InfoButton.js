import { Button } from "react-bootstrap";
import { IoInformationCircle } from "react-icons/io5";

const InfoButton = ({ onClick }) => {

    return (
        <Button
            onClick={onClick}
            style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: '#007bff', // azul
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'fixed',
                bottom: 21,
                right: 21,
                zIndex: 9999,
            }}
        >
            <IoInformationCircle color="#ffffff" size={50} />
        </Button>

    );
};

export default InfoButton;
