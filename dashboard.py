import streamlit as st
import requests

API_URL = "http://localhost:8000"  # Cambia si tu API está desplegada en otro lado

st.set_page_config(page_title="Conversor DXF a G-code/JBI", layout="centered")
st.title("🔧 Conversor DXF a G-code y archivo .JBI para Yaskawa")

# Subida del archivo
uploaded_file = st.file_uploader("📂 Sube tu archivo DXF", type=["dxf"])

if uploaded_file:
    st.success(f"Archivo cargado: {uploaded_file.name}")

    if st.button("🚀 Convertir archivo"):
        with st.spinner("Procesando conversión..."):
            files = {"file": (uploaded_file.name, uploaded_file.getvalue(), "application/octet-stream")}
            response = requests.post(f"{API_URL}/convert/", files=files)

        if response.status_code == 200:
            result = response.json()
            st.success("✅ Conversión exitosa")

            st.subheader("📥 Descargas disponibles")

            # st.download_button(
            #     label="Descargar G-code",
            #     data=result["gcode"],
            #     file_name="output.gcode",
            #     mime="text/plain"
            # )

            # st.download_button(
            #     label="Descargar archivo .JBI",
            #     data=result["jbi"],
            #     file_name="output.jbi",
            #     mime="text/plain"
            # )

        else:
            st.error(f"❌ Error en la conversión: {response.status_code}\n{response.text}")
