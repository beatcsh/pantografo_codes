import streamlit as st
import pandas as pd
import requests

API_URL = "http://localhost:8000"  

st.set_page_config(page_title="DXF a Yaskawa", layout="centered")
st.title("Convertidor DXF a Yaskawa")

try:
    # Obtener tabla
    response = requests.get(f"{API_URL}/tabla")
    response.raise_for_status()
    data = response.json()
    df = pd.DataFrame(data)

    if df.empty or "Material" not in df or "Espesor (mm)" not in df:
        st.error("La tabla no contiene los campos necesarios.")
    else:
        st.subheader("Tabla de parámetros")
        st.dataframe(df)

        # Combinar Material + Espesor para mostrar en una sola opción
        df["Opción"] = df["Material"] + " - " + df["Espesor (mm)"].astype(str) + " mm"
        opcion_seleccionada = st.selectbox("Selecciona material y espesor", df["Opción"].tolist())

        # Obtener la fila correspondiente
        fila = df[df["Opción"] == opcion_seleccionada].iloc[0]

        # Mostrar los parámetros
        velocidad = int(fila["Velocidad (mm/s)"])
        st.number_input("Velocidad (V)", min_value=0, value=velocidad, key="v")

        velocidadj = st.number_input("Velocidad J",min_value = 0, value=30, key="vj")

        # 🔽 Ingreso manual de Z
        z = st.number_input("Valor Z (altura de corte)", value=7, key="z")

        st.text(f"Presión de aire: {fila['Presión de aire (MPa)']}")
        st.text(f"Gas: {fila['Gas']}")
        st.text(f"Enfoque de corte: {fila['enfoque de corte']}")

except Exception as e:
    st.error(f"No se pudo cargar la tabla: {e}")
    velocidad = st.number_input("Velocidad (V)", min_value=0, value=100)
    z = st.number_input("Valor Z (altura de corte)", value=0.0, format="%.2f", key="z")

# Subida de archivo y conversión
st.header("Subir archivo DXF")
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
