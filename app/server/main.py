from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from utils.converter import convertir_dxf_a_yaskawa
import pandas as pd
import os

app = FastAPI()
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

@app.post("/convert/")
async def convertir(file: UploadFile = File(...), velocidad = 0, velocidadj = 0, z_altura = 7):
    try:
        # Guardar archivo subido
        dxf_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(dxf_path, "wb") as buffer:
            buffer.write(await file.read())

        # Ejecutar conversión
        nombre_base = os.path.splitext(file.filename)[0]
        jbi_path, gcode_path = convertir_dxf_a_yaskawa(
            dxf_path,
            z_altura=z_altura,
            velocidad=velocidad,
            nombre_base=nombre_base,
            output_dir=UPLOAD_DIR,
            uf=1,
            ut=1,
            pc=1,
            velocidadj=velocidadj
        )

        return JSONResponse(content={
            "message": "Archivos generados exitosamente",
            "jbi_path": jbi_path,
            "gcode_path": gcode_path
        })
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