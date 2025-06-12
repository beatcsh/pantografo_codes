import { LuFiles } from "react-icons/lu";
import { SiConvertio } from "react-icons/si";
import './Converter.css';

const MenuConverter = ({ setView }) => {

    return (
        <div className="converter-select-container converter-select-bottom-exact">
            <div className="converter-select-row-exact">
                <div className="converter-btn-card-exact" tabIndex={0} onClick={() => setView('files')}>
                    <LuFiles style={{ marginBottom: '25px' }} color="#1876d3" size={80} />
                    <div className="converter-btn-title-exact">FILES</div>
                    <div className="converter-btn-desc-exact">Here you can view and manage<br />the files uploaded to the robot.</div>
                </div>
                <div className="converter-btn-card-exact" tabIndex={0} onClick={() => setView('convert')}>
                    <SiConvertio style={{ marginBottom: '25px' }} color="#1876d3" size={80} />
                    <div className="converter-btn-title-exact">CONVERTER</div>
                    <div className="converter-btn-desc-exact">It is an application that allows the<br />conversion of .dxf files to inform II language.</div>
                </div>
            </div>
        </div>
    )
}

export default MenuConverter