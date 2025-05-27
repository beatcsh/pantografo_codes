@echo off
cd /d %~dp0
start cmd /k "streamlit run dashboard.py"
start cmd /k "streamlit run coordenadas.py --server.port 8502"
