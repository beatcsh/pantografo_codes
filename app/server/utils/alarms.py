import matplotlib
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from matplotlib.ticker import FormatStrFormatter
import io
import base64

matplotlib.use("Agg") # pa que no chille el matplot

"""
base64 es un formato de codificacion de binarios como imagenes archivos y mas cosas, 
pasandolos a texto plano usando caracteres seguros

sirve para enviar archivos como imagenes dentro de un JSON o meter 
imagenes directas al codigo sin usar ficheros y ya, en este caso nos servira pa mostrar las graficas
"""

def fig_to_base64(fig):
    buf = io.BytesIO() # esta cosa es un buffer temporal que va pa la ram
    plt.savefig(buf, format='png', bbox_inches='tight') # aaui se guarda la figurita como png en el buffer y lo ultimo le quita los bordes que no se ocupan
    plt.close(fig) # aqui ps se cierra la figura pq dejarla en el buffer causarioa acumulacion en la memoria con figuritas fantasmas
    buf.seek(0) # como trabajamos con punteros es mejor reiniciarlos para leer todo desde 0
    return base64.b64encode(buf.read()).decode('utf-8') # se lee el contenido del buffer y se convierte a base64 lo que este, se devuelve como una cadenota de texto para enviarla mas facil como JSON

def generate_graphs(df: pd.DataFrame):
    graphs = []

    df_copy = df.copy()
    df_copy.dropna(inplace=True)
    
    # grafica 1 con un histograma por codes
    fig1, ax1 = plt.subplots() # se crea una figura y un set de ejes para dibujar una grafica
    df_copy['Code'].plot(kind='hist', bins=20, color='steelblue', ax=ax1) # usando pandas creamos un histograma de la columna que queremos
    ax1.set_title("Codes Histogram") # un titulo pa que chambee
    ax1.spines[['top', 'right',]].set_visible(False) # le quitamos las lineas del borde superior y derecho pa que se vea limpia, spines son las paderes del grafico o bordes, como lo quieran ver
    graphs.append({
        "title": "Codes Histogram",
        "image": fig_to_base64(fig1)
    }) # aqui se agrega la imagen al array con todas las demas figuras ya convertidas a base64

    # grafica 2 que va por los modos alarmados
    fig2, ax2 = plt.subplots()
    df_copy.groupby('Mode').size().plot(kind='barh', color=sns.palettes.mpl_palette('Dark2'), ax=ax2)
    ax2.set_title("Alarms per Mode")
    ax2.spines[['top', 'right',]].set_visible(False)
    graphs.append({
        "title": "Alarms per Mode",
        "image": fig_to_base64(fig2)
    })

    # grafica 3 que va ahora por la localizacion de la alarma osea donde ocurrio
    fig3, ax3 = plt.subplots()
    df_copy.groupby('Location').size().plot(kind='barh', color=sns.palettes.mpl_palette('Dark2'), ax=ax3)
    ax3.set_title("Alarms per Location")
    ax3.spines[['top', 'right',]].set_visible(False)
    graphs.append({
        "title": "Alamrs per Location",
        "image": fig_to_base64(fig3)
    })

    # aqui empieza toda la limpieza pa esa cosa que va a lo largo del tiempo y asi los comentarios en ingles vienen desde el colab
    df_copy['Datetime'] = pd.to_datetime(df_copy['Datetime']) # separate date and time
    df_copy['Date'] = df_copy['Datetime'].dt.date
    df_copy['Time'] = df_copy['Datetime'].dt.time

    # converting date column

    df_copy['Date'] = pd.to_datetime(df_copy['Date'], format='%Y-%m-%d')

    # Group by date and count occurrences
    alarms_by_date = df_copy.groupby('Date').size().reset_index(name='Count')

    # Set plot size
    fig4, ax4 = plt.subplots(figsize=(8, 4))

    # Plot the data
    ax4.plot(alarms_by_date['Date'], alarms_by_date['Count'], marker='o', linestyle='-')
    # Add labels and title
    ax4.set_xlabel('Date')
    ax4.set_ylabel('Number of Alarms')
    ax4.set_title('Alarms Over Time')
    ax4.grid(True)
    fig4.autofmt_xdate()
    graphs.append({
        "title": "Alarms Over Time",
        "image": fig_to_base64(fig4)
    })

    return graphs