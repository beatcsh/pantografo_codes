import streamlit as st
import requests
import time

YM_API_URL = "http://localhost:5229"  # Usa el mismo puerto que tu API de C#

st.set_page_config(page_title="Coordenadas Robot", layout="wide")

st.markdown("### Coordenadas en tiempo real (actualiza cada segundo)")

if 'coords_refresh_count' not in st.session_state:
    st.session_state['coords_refresh_count'] = 0

try:
    r = requests.get(f"{YM_API_URL}/Robot/coordinates")
    r.raise_for_status()
    coords = r.json()
    etiquetas = ['S', 'L', 'U', 'R', 'B', 'T', 'E', 'W']
    texto = ""
    for i, val in enumerate(coords):
        texto += f"**{etiquetas[i]}:** {val} pulses  \n"
    st.markdown(texto)
except Exception as e:
    st.error(f"Error al obtener coordenadas: {e}")

# Refresca solo este panel cada segundo
import streamlit_autorefresh
streamlit_autorefresh.st_autorefresh(interval=1000, key="coords_autorefresh_panel")
