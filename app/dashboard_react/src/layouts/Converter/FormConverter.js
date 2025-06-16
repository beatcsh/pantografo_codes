import { FaUpload } from "react-icons/fa"
import AOS from "aos"
import 'aos/dist/aos.css'
import { useEffect } from "react"

const FormConverter = ({ setView, tabla, setFile, file, form, handleRowSelect, handleFormChange, handleConvert, downloadUrl, convertError, convertLoading }) => {
    useEffect(() => {
        AOS.init()
    }, [])

    return (
        <div data-aos="zoom-in-up" className="converter-flex-exact">
            {/* Panel izquierdo: Tabla de parámetros */}
            <div className="converter-table-panel-exact">
                <div className="converter-table-title-row">
                    <div className="converter-table-title">CUT PARAMETERS</div>
                    <div className="converter-table-title-underline" />
                </div>
                <div className="converter-table-headers-row">
                    <div className="converter-table-header">MATERIAL</div>
                    <div className="converter-table-header">CURRENT</div>
                    <div className="converter-table-header">WIDTH (mm)</div>
                    <div className="converter-table-header">SPEED CUT (mm/s)</div>
                </div>
                <div className="converter-table-list converter-table-scrollable">
                    {tabla.map((row, i) => (
                        <div className="converter-table-row" key={i} onClick={() => handleRowSelect(row)}>
                            <div className="converter-table-cell converter-table-cell-material">{row['Material']}</div>
                            <div className="converter-table-cell">{row['Corriente (A)']} A</div>
                            <div className="converter-table-cell">{row['Espesor (mm)']}</div>
                            <div className="converter-table-cell">{row['Velocidad corte (mm/s)']}</div>
                        </div>
                    ))}
                </div>
                <button style={{ marginTop: '28px' }} className="converter-back-btn" onClick={() => setView('select')}>
                    ← Back
                </button>
            </div>
            {/* Panel derecho: Formulario de conversión */}
            <div className="converter-form-panel-exact">
                <div className="converter-form-title">CONVERT .DXF TO INFORM II</div>
                <div className="converter-form-subtitle">(SELECT A .DXF FILE TO CONVERT TO ROBOT YASKAWA LENGUAJE)</div>
                <div className="converter-form-file-row">
                    <label className="converter-form-file-btn">
                        SELECT YOUR FILE
                        <input type="file" accept=".dxf" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])} />
                    </label>
                    <div className="converter-form-file-name">{file ? file.name : ''}</div>
                </div>
                <form onSubmit={handleConvert} className="converter-form-fields-grid">
                    <div className="converter-form-field-group">
                        <label className="converter-form-label">MATERIAL</label>
                        <input className="converter-form-input" name="Material" value={form['Material']} onChange={handleFormChange} />
                    </div>
                    <div className="converter-form-field-group">
                        <label className="converter-form-label">J SPEED</label>
                        <input className="converter-form-input" name="Velocidad J" value={form['Velocidad J']} onChange={handleFormChange} />
                    </div>
                    <div className="converter-form-field-group">
                        <label className="converter-form-label">CURRENT</label>
                        <input className="converter-form-input" name="Corriente (A)" value={form['Corriente (A)']} onChange={handleFormChange} />
                    </div>
                    <div className="converter-form-field-group">
                        <label className="converter-form-label">Z POSITION</label>
                        <input className="converter-form-input" name="Z" value={form['Z']} onChange={handleFormChange} />
                    </div>
                    <div className="converter-form-field-group">
                        <label className="converter-form-label">WIDTH</label>
                        <input className="converter-form-input" name="Espesor (mm)" value={form['Espesor (mm)']} onChange={handleFormChange} />
                    </div>
                    <div className="converter-form-field-group">
                        <label className="converter-form-label">USER FRAME</label>
                        <input className="converter-form-input" name="User Frame" value={form['User Frame']} onChange={handleFormChange} />
                    </div>
                    <div className="converter-form-field-group">
                        <label className="converter-form-label">SPEED CUT</label>
                        <input className="converter-form-input" name="Velocidad corte (mm/s)" value={form['Velocidad corte (mm/s)']} onChange={handleFormChange} />
                    </div>
                    <div className="converter-form-field-group">
                        <label className="converter-form-label">TOOL</label>
                        <input className="converter-form-input" name="Tool" value={form['Tool']} onChange={handleFormChange} />
                    </div>
                    {/* <div className="converter-form-field-group">
                        <label className="converter-form-label">PLASMA</label>
                        <input className="converter-form-input" name="Plasma" value={form['Plasma']} onChange={handleFormChange} />
                    </div> */}
                    <div className="converter-form-field-group">
                        <label className="converter-form-label">Kerf</label>
                        <input className="converter-form-input" name="Kerf" value={form['Kerf']} onChange={handleFormChange} />
                    </div>
                    <div className="converter-form-field-group">
                        <label className="converter-form-label">Tipo de herramienta</label>
                        <select
                            name='Uso'
                            className="converter-form-input"
                            value={form['Uso']}
                            onChange={handleFormChange}
                        >
                            <option value="0">Plasma</option>
                            <option value="1">Demel</option>
                        </select>
                    </div>
                </form>
                <button className="converter-form-submit-btn" type="submit" onClick={handleConvert} disabled={convertLoading}>
                    CONVERT & UPLOAD <FaUpload style={{ marginLeft: 10, marginBottom: -3 }} />
                </button>
                {convertError && <div className="converter-form-error">{convertError}</div>}
                {downloadUrl && (
                    <a href={downloadUrl} download={file ? file.name.replace(/\.[^.]+$/, '.JBI') : 'programa.jbi'} className="converter-form-download-link">Descargar archivo .JBI</a>
                )}
            </div>
        </div>
    )
}

export default FormConverter