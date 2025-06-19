import { IoInformationCircle } from "react-icons/io5";

const InfoButton = ({ onClick }) => {

    return (
        <IoInformationCircle style={{
            position: 'fixed',
            bottom: 21,
            right: 21,
            zIndex: 9999,
            cursor: 'pointer',
            // borderRadius: '50%', 
            // padding: '0.1px',   
        }} onClick={onClick} color="#ffffff" size={50} />
    );
};

export default InfoButton;
