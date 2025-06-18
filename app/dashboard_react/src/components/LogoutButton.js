import { FaSignOutAlt } from 'react-icons/fa';

const LogoutButton = ({ onLogout }) => {
    return (
        <button
            onClick={onLogout}
            style={{
                position: 'fixed',
                top: 24,
                right: 84,
                zIndex: 1000,
                background: '#ffffff',
                border: '2px solid #1976d2',
                color: '#1976d2',
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 18,
                padding: '8px 18px 8px 14px',
                boxShadow: '0 2px 12px #1976d211',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                transition: 'background 0.18s',
            }}
            title="Logout"
        >
            <FaSignOutAlt size={20} /> Logout
        </button>
    )
}

export default LogoutButton