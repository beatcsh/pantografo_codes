# 🤖 PANTOGRAFO PLASMA

Interfaz de comunicación desarrollado en FastAPI (Python) para control y monitoreo de robots industriales Yaskawa. Permite el manejo de movimientos, lectura de posiciones, conversion de archivos .DXF a .JBI y transferencia de archivos vía FTP. Se integra con otro servicio, el cual se encuentra en https://github.com/beatcsh/YMConnectApi .

---

## 🧩 Tecnologías utilizadas

- 🐍 FastAPI - Python
- 📤 FTP (transferencia de archivos)
- 🪛 Tecnologia de robots industriales de Yaskawa
- 🕸️ ReactJS

---

## 🚀 Cómo iniciar el proyecto

### 📦 Requisitos

- [Python 3.10+](https://www.python.org/)
- FastAPI (`pip install fastapi uvicorn`)
- Shapely (`pip install shapely`)
- EZDXF (`pip install ezdxf`)
- Ftplib (`pip install ftplib`)
- Node [^20.15.0]
- ReactJS y dependencias instaladas (`npm install` dentro de la carpeta /dashboard_react)
- Acceso FTP al robot (revisar el manual de conexiones segun el controlador usado)

### 🏃 Instalar dependencias e Iniciar servidores (por separado)

```Desde Powershell o CMD
> Instalar dependencias
cd app/server ------> pip install -r requirements.txt
cd app/dashboard_react ------> npm install

> PowerShell o CMD
cd app/server ------ python -m uvicorn main:app --reload
cd app/dashboard_react ------ npm start
