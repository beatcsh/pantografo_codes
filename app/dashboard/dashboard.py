#Hola esto es un comentario para prueba

import streamlit as st
import pandas as pd
import requests

API_URL = "http://localhost:8000"  

st.set_page_config(page_title="DXF a Yaskawa", layout="wide")

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
    df = pd.DataFrame(data)

    if df.empty or "Material" not in df or "Espesor (mm)" not in df:
        st.error("La tabla no contiene los campos necesarios.")
    else:
        col1, col2 = st.columns([1.2, 1])

        with col1:
            st.image("yaskawa_logo.png", width=300)
            st.subheader("Tabla de parámetros")
            st.dataframe(df, use_container_width=True)

            if "Potencia" in df.columns:
                df["Opción"] = (
                    df["Material"] + " - " +
                    df["Espesor (mm)"].astype(str) + " mm - " +
                    df["Potencia"].astype(str) + " W"
                )
            else:
                df["Opción"] = (
                    df["Material"] + " - " +
                    df["Espesor (mm)"].astype(str) + " mm"
                )

            opcion_seleccionada = st.selectbox("Selecciona material, espesor y potencia", df["Opción"].tolist())
            fila = df[df["Opción"] == opcion_seleccionada].iloc[0]

        with col2:
            st.subheader("Tabla de parámetros")
            velocidad = int(fila["Velocidad (mm/s)"])
            velocidad = st.number_input("Velocidad (V)", min_value=0, value=velocidad, key="v")
            velocidadj = st.number_input("Velocidad J", min_value=0, value=30, key="vj")
            z = st.number_input("Valor Z (altura de corte)", value=7, key="z")

            st.text(f"Presión de aire: {fila['Presión de aire (MPa)']}")
            st.text(f"Gas: {fila['Gas']}")
            st.text(f"Enfoque de corte: {fila['enfoque de corte']}")

            st.divider()
            st.subheader("Subir archivo DXF")
            uploaded_file = st.file_uploader("Selecciona un archivo .dxf", type=["dxf"])

            if st.button("Convertir"):
                if uploaded_file:
                    with st.spinner("Convirtiendo archivo..."):
                        files = {"file": (uploaded_file.name, uploaded_file, "application/dxf")}
                        params = {"velocidad": velocidad, "z_altura": z, "velocidadj": velocidadj}
                        try:
                            response = requests.post(f"{API_URL}/convert/", files=files, params=params)
                            if response.status_code == 200:
                                data = response.json()
                                st.success("¡Conversión completada!")
                                jbi_path = data["jbi_path"]
                                st.download_button("Descargar archivo .JBI", data=open(jbi_path, "rb"), file_name="programa.jbi")
                            else:
                                st.error("Error al convertir el archivo")
                        except Exception as e:
                            st.error(f"Error en la solicitud: {e}")
                else:
                    st.warning("Por favor, sube un archivo primero.")

            # --- NUEVA SECCIÓN: ARCHIVOS JBI ---
            st.divider()
            st.subheader("📁 Archivos en el robot Yaskawa")

            try:
                jobs_response = requests.get(f"{API_URL}/listar-jobs")
                jobs_response.raise_for_status()
                archivos = jobs_response.json()

                if archivos:
                    filtro = st.text_input("🔍 Buscar archivo", placeholder="Escribe el nombre del archivo...")
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
                                                st.success(f"Archivo '{archivo}' eliminado correctamente.")
                                                # st.experimental_rerun()
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
