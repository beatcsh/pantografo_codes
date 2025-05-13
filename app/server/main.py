from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from utils.converter import convertir_dxf_a_yaskawa
import os

app = FastAPI()
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/convertir")
async def convertir(file: UploadFile = File(...)):
    try:
        # Guardar archivo subido
        dxf_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(dxf_path, "wb") as buffer:
            buffer.write(await file.read())

        # Ejecutar conversión
        nombre_base = os.path.splitext(file.filename)[0]
        jbi_path, gcode_path = convertir_dxf_a_yaskawa(
            dxf_path,
            z_altura=7,
            velocidad=15,
            nombre_base=nombre_base,
            output_dir=UPLOAD_DIR,
            uf=1,
            ut=1,
            pc=1,
            velocidadj=85.0
        )

        return JSONResponse(content={
            "message": "Archivos generados exitosamente",
            "jbi_path": jbi_path,
            "gcode_path": gcode_path
        })
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)