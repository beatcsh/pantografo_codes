import streamlit as st

# ✅ ESTA LÍNEA DEBE SER LA PRIMERA INSTRUCCIÓN DE STREAMLIT
st.set_page_config(page_title="DXF a Yaskawa", layout="wide")

import pandas as pd
import requests
import streamlit.components.v1 as components
import time
import threading
from streamlit_autorefresh import st_autorefresh

API_URL = "http://localhost:8000"
# Cambia este puerto al que realmente use tu API de C#
YM_API_URL = "http://localhost:5229"  # <-- AJUSTA AQUÍ SI TU API DE C# USA OTRO PUERTO

# Estado para controlar si el sidebar está abierto o cerrado
if "sidebar_open" not in st.session_state:
    st.session_state.sidebar_open = False

if "ymconnect_open" not in st.session_state:
    st.session_state.ymconnect_open = False

# Botón para abrir/cerrar la barra lateral
if st.sidebar.button("Abrir/Cerrar Dashboard"):
    st.session_state.sidebar_open = not st.session_state.sidebar_open

# Botón para abrir/cerrar YMConnect
if st.sidebar.button("Abrir/Cerrar YMConnect"):
    st.session_state.ymconnect_open = not st.session_state.ymconnect_open

# Mostrar contenido solo si está abierto
if st.session_state.sidebar_open:

    # --- ESTILOS CSS PERSONALIZADOS ---
    st.markdown("""
    <style>
    div.stButton > button {
        background-color: #007bff !important;
        color: white !important;
        border-radius: 8px !important;
        padding: 0.6em 1em !important;
        font-weight: 600;
        transition: background-color 0.3s ease;
        border: none;
    }
    div.stButton > button:hover {
        background-color: #0056b3 !important;
        cursor: pointer;
    }
    div.stDownloadButton > button {
        background-color: #28a745 !important;
        color: white !important;
        border-radius: 8px !important;
        padding: 0.6em 1em !important;
        font-weight: 600;
        transition: background-color 0.3s ease;
        border: none;
    }
    div.stDownloadButton > button:hover {
        background-color: #218838 !important;
        cursor: pointer;
    }
    input[type="file"],
    input[type="number"],
    input[type="range"],
    select,
    button,
    div[data-testid="stFileUploader"],
    div[data-baseweb="select"],
    label,
    .css-1cpxqw2,
    .css-1wa3eu0,
    .css-1aehpvj,
    .css-1v0mbdj {
        cursor: pointer !important;
    }
    </style>
    """, unsafe_allow_html=True)

    try:
        response = requests.get(f"{API_URL}/tabla")
        response.raise_for_status()
        data = response.json()

        # Verificar que la tabla no esté vacía y tenga las columnas necesarias
        if not data:
            st.warning("No se encontraron datos en la tabla.")
        else:
            df = pd.DataFrame(data)

            if df.empty or "Material" not in df or "Espesor (mm)" not in df or "Corriente (A)" not in df:
                st.error("La tabla no contiene los campos necesarios.")
            else:
                col1, col2 = st.columns([1.2, 1])

                with col1:
                    st.image("yaskawa_logo.png", width=300)
                    st.subheader("Tabla de medidas")
                    st.dataframe(df, use_container_width=True)

                    df["Opción"] = (
                        df["Material"] + " - " +
                        df["Espesor (mm)"].astype(str) + " mm - " +
                        df["Corriente (A)"].astype(str) + " A"
                    )

                    opcion_seleccionada = st.selectbox("Selecciona material, espesor y corriente", df["Opción"].tolist())
                    fila = df[df["Opción"] == opcion_seleccionada].iloc[0]

                with col2:
                    with st.expander("⚙️ Mostrar/ocultar parámetros de corte y subida de archivo", expanded=True):
                        st.subheader("Tabla de parámetros")

                        inputs = {}
                        for columna in df.columns:
                            if columna != "Opción":
                                valor = fila[columna]
                                if isinstance(valor, (int, float)):
                                    inputs[columna] = st.number_input(columna, value=float(valor), key=columna)
                                else:
                                    inputs[columna] = st.text_input(columna, value=str(valor), key=columna)

                        velocidadj = st.number_input("Velocidad J", min_value=0, value=30, key="vj")
                        z = st.number_input("Valor Z (altura de corte)", value=7, key="z")

                        st.divider()
                        st.subheader("Subir archivo DXF")
                        uploaded_file = st.file_uploader("Selecciona un archivo .dxf", type=["dxf"])

                    if st.button("Convertir"):
                        if uploaded_file:
                            with st.spinner("Convirtiendo archivo..."):
                                files = {"file": (uploaded_file.name, uploaded_file, "application/dxf")}
                                params = {
                                    "velocidad": int(inputs.get("Velocidad corte (mm/s)", 100)),
                                    "z_altura": z,
                                    "velocidadj": velocidadj
                                }
                                try:
                                    response = requests.post(f"{API_URL}/convert/", files=files, params=params)
                                    if response.status_code == 200:
                                        # data = response.json()
                                        st.success("¡Conversión completada!")
                                        # jbi_path = data["jbi_path"]
                                        st.download_button("Descargar archivo .JBI", data = response.content, file_name="programa.jbi")
                                    else:
                                        st.error("Error al convertir el archivo")
                                except Exception as e:
                                    st.error(f"Error en la solicitud: {e}")
                        else:
                            st.warning("Por favor, sube un archivo primero.")

                # --- NUEVA SECCIÓN: ARCHIVOS JBI ---
                st.divider()
                st.subheader("🗀 Archivos en el robot Yaskawa")

                try:
                    jobs_response = requests.get(f"{API_URL}/listar-jobs")
                    jobs_response.raise_for_status()
                    archivos = jobs_response.json()

                    if archivos:
                        filtro = st.text_input("🔍︎ Buscar archivo", placeholder="Escribe el nombre del archivo...")
                        archivos_filtrados = [a for a in archivos if filtro.lower() in a.lower()]

                        if archivos_filtrados:
                            for idx, archivo in enumerate(archivos_filtrados):
                                with st.container():
                                    colA, colB = st.columns([6, 1])
                                    with colA:
                                        st.markdown(f"""
                                            <div style="padding: 0.4em 0.8em; background-color: #000000; border: 1px solid #dee2e6; border-radius: 8px;">
                                                <strong>{archivo}</strong>
                                            </div>
                                        """, unsafe_allow_html=True)
                                    with colB:
                                        if st.button("🗑️", key=f"del_{archivo}_{idx}"):
                                            try:
                                                delete_response = requests.delete(f"{API_URL}/borrar", params={"idx": archivos.index(archivo)})
                                                if delete_response.status_code == 200:
                                                    components.html(f"""
                                                        <script>
                                                            alert("El archivo '{archivo}' se eliminó correctamente.");
                                                        </script>
                                                    """, height=0)
                                                    st.rerun()
                                                else:
                                                    st.error("No se pudo eliminar el archivo.")
                                            except Exception as e:
                                                st.error(f"Error al eliminar: {e}")
                        else:
                            st.info("No se encontraron archivos que coincidan con la búsqueda.")
                    else:
                        st.info("No hay archivos .jbi disponibles.")
                except Exception as e:
                    st.error(f"No se pudieron obtener los archivos del robot: {e}")

    except Exception as e:
        st.error(f"No se pudo cargar la tabla: {e}")
        velocidad = st.number_input("Velocidad (V)", min_value=0, value=100)
        z = st.number_input("Valor Z (altura de corte)", value=0.0, format="%.2f", key="z")

else:
    st.sidebar.write("Pulsa el botón para abrir el dashboard")

if st.session_state.ymconnect_open:
    st.subheader("Dashboard YMConnect")
    st.title("🤖 Dashboard YMConnect")

    col1, col2, col3 = st.columns(3)

    # --- Columna 1: Estado y coordenadas ---
    with col1:
        status_placeholder = st.empty()
        coords_placeholder = st.empty()

        # Estado del robot (solo una vez por recarga)
        try:
            r = requests.get(f"{YM_API_URL}/Robot/status")
            r.raise_for_status()
            status = r.json()
            status_placeholder.markdown(
                f"""
                ### Estado del robot
                **Modo de control:** {status.get('controlMode', -1)}  
                **Servo:** {status.get('isServoOn', False)}  
                **Ciclo modo:** {status.get('cycleMode')}  
                **¿Está corriendo?:** {status.get('isRunning')}  
                **¿En pausa?:** {status.get('isInHold')}  
                **¿Alarma?:** {status.get('isAlarming')}  
                **¿Error?:** {status.get('isErroring')}
                """
            )
        except Exception as e:
            status_placeholder.error(f"Error al obtener estado: {e}")

        # --- Expander con iframe para coordenadas en tiempo real ---
        with st.expander("📡 Ver coordenadas en tiempo real", expanded=True):
            components.iframe("http://localhost:8502", height=250)

        # Información del sistema
        if st.button("ℹ️ Obtener info sistema (/Robot/information)"):
            try:
                r = requests.get(f"{YM_API_URL}/Robot/information")
                r.raise_for_status()
                info = r.json()
                st.write("### Información del sistema")
                st.write(f"Versión software: {info.get('softwareVersion')}")
                st.write(f"Nombre modelo: {info.get('modelName')}")
            except Exception as e:
                st.error(f"Error al obtener información: {e}")

    # --- Columna 2: Control de trabajo ---
    with col2:
        if st.button("▶️ Iniciar trabajo (/Robot/startJob)"):
            try:
                r = requests.get(f"{YM_API_URL}/Robot/startJob")
                r.raise_for_status()
                resp = r.json()
                st.success(f"Trabajo iniciado: {resp.get('message', 'OK') if isinstance(resp, dict) else resp}")
            except Exception as e:
                st.error(f"Error al iniciar trabajo: {e}")

        if st.button("🛑 Detener trabajo (/Robot/stopJob)"):
            try:
                r = requests.get(f"{YM_API_URL}/Robot/stopJob")
                r.raise_for_status()
                resp = r.json()
                st.success(f"Trabajo detenido: {resp.get('message', 'OK') if isinstance(resp, dict) else resp}")
            except Exception as e:
                st.error(f"Error al detener trabajo: {e}")

        if st.button("📋 Obtener trabajo en ejecución (/Robot/exeJob)"):
            try:
                r = requests.get(f"{YM_API_URL}/Robot/exeJob")
                r.raise_for_status()
                job = r.json()
                st.write("### Trabajo en ejecución")
                st.write(f"Nombre: {job.get('name', job)}")
                st.write(f"Línea: {job.get('line', '')}")
                st.write(f"Paso: {job.get('stepNumber', '')}")
                st.write(f"Velocidad Override: {job.get('speedOverride', '')}%")
            except Exception as e:
                st.error(f"Error al obtener trabajo: {e}")

    # --- Columna 3: Gestión de archivos JBI ---
    with col3:
        st.write("### Archivos JBI disponibles")
        try:
            resp = requests.get(f"{YM_API_URL}/Robot/jobList")
            resp.raise_for_status()
            lista_jobs = resp.json() if resp.status_code == 200 else []
            if lista_jobs:
                nombre_job = st.selectbox("Selecciona un job para cargar", lista_jobs)
                if st.button("Seleccionar job"):
                    try:
                        r = requests.get(f"{YM_API_URL}/Robot/setJob/{nombre_job}")
                        r.raise_for_status()
                        st.success(f"Job '{nombre_job}' seleccionado correctamente (API C#).")
                    except Exception as e:
                        st.error(f"Error al seleccionar job: {e}")
            else:
                st.info("No hay archivos jbi disponibles.")
        except Exception as e:
            st.error(f"No se pudo obtener la lista de jobs: {e}")

