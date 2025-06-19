from utils.converter import generate_gcode_from_dxf, gcode_a_yaskawa
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, UploadFile, File
from utils.ftp_manager import GestorFTP
import pandas as pd
import os
 
"""
    .
░░░░░███████ ]▄▄▄▄▄▄ `~~~~~~ ~~~~ ~~~~ ~~~
▂▄▅████████▅▄▃ ...............
Il███████████████████]
◥⊙▲⊙▲⊙▲⊙▲⊙▲⊙▲⊙◤..

"""

gestor = GestorFTP()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# falta la profundidad de corte - zp    -- numero de pasadas - pa        -- 
@app.post("/convert/")
async def convertir(
        file: UploadFile = File(...),
        velocidad: int = 15,
        velocidadj: int = 15,
        z_altura: float = 7,
        uf: int = 1,
        ut: int = 1,
        pc: int = 1,
        kerf = 0,
        uso = 0, # al mandar un 1 en la solicitud es dremel, el 0 corresponde al cortador
        zp = 1,
        pa = 1
    ):
    try:
        # Guardar archivo subido
        dxf_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(dxf_path, "wb") as buffer:
            buffer.write(await file.read())

        gcode_lines = generate_gcode_from_dxf(dxf_path, z_altura, kerf, uso, zp, pa)

        nombre_base = os.path.splitext(file.filename)[0]
        
        jbi_path, gcode_path = gcode_a_yaskawa(
            gcode_lines = gcode_lines,
            z_altura = z_altura,
            velocidad = velocidad,
            nombre_base = nombre_base,
            output_dir = UPLOAD_DIR,
            uf = uf,
            ut = ut,
            pc = pc,
            velocidadj = velocidadj,
            zp = zp
        )

        return FileResponse(path = jbi_path, media_type = "application/octet-stream", filename = nombre_base)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
    
@app.get("/tabla")
async def get_tabla():
    try:
        archivo_csv = os.path.join(BASE_DIR, 'data', 'parametros_corte_laser.csv')
        df = pd.read_csv(archivo_csv, sep = ',')
        df_copy = df.fillna(value="None")
        response_data = df_copy.to_dict(orient = 'records')
        return JSONResponse(content = response_data, status_code = 200)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code = 500)
    
@app.get("/listar-jobs")
async def listar_jobs(FTP_HOST = ""):
    try:
        data = gestor.listar_archivos(FTP_HOST)
        return JSONResponse(content = data, status_code = 200)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code = 500)
    
@app.delete("/borrar")
async def eliminar_job(idx = 0, FTP_HOST = ""):
    try:
        response = gestor.eliminar_archivo(idx, FTP_HOST)
        return JSONResponse(content = response, status_code = 200)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code = 500)
    
@app.get("/enviar-ftp")
def enviar_ftp(filename: str = "", FTP_HOST = ""):  # No async para evitar problemas con ftplib
    try:
        # Busca el archivo en la carpeta de uploads
        jbi_path = os.path.join(UPLOAD_DIR, filename)
        if not os.path.exists(jbi_path):
            return JSONResponse(content={"error": "Archivo no encontrado"}, status_code=404)
        gestor = GestorFTP()
        gestor.subir_archivo(jbi_path, FTP_HOST)
        gestor.cerrar_conexion()
        return JSONResponse(content={"ok": True}, status_code=200)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500) 