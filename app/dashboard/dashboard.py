import streamlit as st
import requests
import os

API_URL = "http://localhost:8000"  

st.set_page_config(page_title="DXF a Yaskawa", layout="centered")

st.title("Convertidor DXF a Yaskawa")

st.header("Subir archivo DXF")

uploaded_file = st.file_uploader("Selecciona un archivo .dxf", type=["dxf"])
velocidad = st.number_input("Velocidad (V)", min_value=0, value=100)
velocidadj = st.number_input("VelocidadJ (VJ)", min_value=0, value=20)
z_altura = st.number_input("Altura Z", min_value=0, value=5)

if st.button("Convertir"):
    if uploaded_file:
        with st.spinner("Subiendo y convirtiendo archivo..."):
            files = {"file": (uploaded_file.name, uploaded_file, "application/dxf")}
            params = {
                "velocidad": velocidad,
                "velocidadj": velocidadj,
                "z_altura": z_altura
            }
            try:
                response = requests.post(f"{API_URL}/convert/", files=files, params=params)
                if response.status_code == 200:
                    data = response.json()
                    st.success("¡Conversión completada!")
                    st.download_button("Descargar archivo .JBI", data=open(data["jbi_path"], "rb").read(), file_name=os.path.basename(data["jbi_path"]))
                    st.download_button("Descargar archivo .gcode", data=open(data["gcode_path"], "rb").read(), file_name=os.path.basename(data["gcode_path"]))
                else:
                    st.error(f"Error en la conversión: {response.text}")
            except Exception as e:
                st.error(f"Error al conectarse a la API: {e}")
    else:
        st.warning("Por favor, selecciona un archivo DXF.")