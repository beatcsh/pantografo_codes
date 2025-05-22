import tkinter as tk
from tkinter import filedialog, messagebox, ttk
from tkinter import Toplevel, Button                        #Tkinter es la libreria para la aplicación
from PIL import Image, ImageTk                      
import os     
import ezdxf                                                #Libreria para convertit de dxf a codigo G
import math
from shapely.geometry import Polygon, Point, LineString
from shapely.ops import unary_union                                    
from datetime import datetime                       
import ftplib   
import csv                                                  # Importar el módulo csv para poder usar los archivos .csv para las tablas

PULSES_POR_MM = 1                                           #Cuando se requiera obtener el valor en pulsos, se cambia esta variable
kerf = 1.5                                                  #Valor compensación de la herramienta

#Configuración de usuario para entrar al servidor del robot
FTP_HOST = "192.168.1.31"                                   #IP del servidor                                
FTP_USER = "rcmaster"                                       #Nombre de usuario con todos los privilegios
FTP_PASS = "9999999999999999"                               #Contraseña del modo mantenimiento

def is_clockwise(points):                                   #Función que decide si es un corte exterior o interior dependiendo de la orientacioón
    area = 0
    for i in range(len(points)):
        x1, y1 = points[i]
        x2, y2 = points[(i + 1) % len(points)]
        area += (x2 - x1) * (y2 + y1)
    return area > 0

def circular_lead_in(start_point, kerf=1.5, clockwise=True):                                    #Crea el lead-in para los cortes circulares
    """Devuelve un arco de entrada circular como lista de puntos"""                             #Haciendo un arco
    cx, cy = start_point[0] - kerf, start_point[1] if clockwise else start_point[1] + kerf      #Aún por verificar su funcionamiento
    segments = 10
    angle_step = (math.pi / 2) / segments
    points = []
    for i in range(segments + 1):
        angle = angle_step * i
        x = cx + kerf * math.cos(angle)
        y = cy + kerf * math.sin(angle) if clockwise else cy - kerf * math.sin(angle)
        points.append((x, y))
    return points

def linear_lead_in(points, kerf=1.5, clockwise = True):                         #Crea el lead-in para los cortes lineales
    x, y = points[0][0], points[0][1]                                           #Haciendo una linea del tamaño del kerf, yendo de afuera a adentro   
    cy, cx = (points[1][1]-points[0][1]), (points[1][0]-points[0][0])

    if (cx == 0) or (cy == 0):                              #Detecta la dirección a la que corta
        if cx == 0 and cy > 0:
            kerf_ang = math.radians(90)
        elif cx == 0 and cy < 0:
            kerf_ang = math.radians(270)
        elif cx > 0 and cy == 0:
            kerf_ang = math.radians(0)
        elif cx < 0 and cy == 0:
            kerf_ang = math.radians(180)
    elif (cx < 0) and (cy < 0):                             #Detecta cuando corta en menos x y menos y (Para obtener el ángulo correctamente)
        kerf_ang = math.atan(cy/cx) + math.radians(180)         
    else:
        kerf_ang = math.atan(cy/cx)                         #Calcula la inclinación de la linea para que el lead + el corte hagan una línea recta
    
    kerf_x = kerf * math.cos(kerf_ang)                      
    kerf_y = kerf * math.sin(kerf_ang)
    
    if clockwise == False:                                  #Regresa el valor de x y y cuando es corte interno
        lead_start = (x+kerf_x, y+kerf_y)
    elif clockwise == True:
        lead_start = (x-kerf_x, y-kerf_y)                   #Regresa el valor de x y y cuando es corte externo
    return [lead_start, (x, y)]


def approximate_spline(entity, segments=20):                #* No sabe que hace *
    return [entity.points(i / segments)[:2] for i in range(segments + 1)]

def generate_gcode_from_dxf(filename):                      #Empieza a cear el código G
    doc = ezdxf.readfile(filename)                          #Lee el archivo .dxf con ezdxf
    msp = doc.modelspace()                                  #Crea un modelo en el espacio para ser utilizado
    gcode = []                                              

    gcode.append("G21 ; mm")                                #Declara que las unidades son milimetros
    gcode.append("G90 ; abs")                               #Las coordenadas serán absolutas
    gcode.append("M05 ; plasma off")                        #Inicia el programa con el cortador de plasma desenergizado

    for entity in msp:                                                  #Identifica si la instrucción es una linea, un circulo, una polilinea
        points = []                                                     #un arco, o un spline

        if entity.dxftype() == 'LINE':                                  #Si es una linea, regresa el valor inicial y el final
            start = (entity.dxf.start.x, entity.dxf.start.y)
            end = (entity.dxf.end.x, entity.dxf.end.y)
            points = [start, end]

        elif entity.dxftype() in ['LWPOLYLINE', 'POLYLINE']:            #Para cuando es una polilinea
            points = [tuple(p[:2]) for p in entity.get_points()]

        elif entity.dxftype() == 'ARC':                                 #Calcula y crea varios puntos para generar el arco
            center = (entity.dxf.center.x, entity.dxf.center.y)
            r = entity.dxf.radius
            start_a = math.radians(entity.dxf.start_angle)
            end_a = math.radians(entity.dxf.end_angle)
            if end_a < start_a:
                end_a += 2 * math.pi
            steps = 20
            points = [
                (center[0] + r * math.cos(start_a + i * (end_a - start_a) / steps),
                 center[1] + r * math.sin(start_a + i * (end_a - start_a) / steps))
                for i in range(steps + 1)
            ]

        elif entity.dxftype() == 'CIRCLE':                              #Crea todos los puntos para generar el círculo completo
            center = (entity.dxf.center.x, entity.dxf.center.y)
            r = entity.dxf.radius
            steps = 40
            points = [
                (center[0] + r * math.cos(2 * math.pi * i / steps),
                 center[1] + r * math.sin(2 * math.pi * i / steps))
                for i in range(steps)
            ]

        elif entity.dxftype() == 'SPLINE':                              #Calcula los puntos con la función de approximate_spline
            points = approximate_spline(entity)

        if points:                                                      #Empieza a escribir las instrucciones dependiendo del tipo
            line = 0
            # Determinar si es interior o exterior
            is_outer = not is_clockwise(points)
            kind = 'Exterior' if is_outer else 'Interior'                  

            if entity.dxftype() == 'LINE':                                      #Si es una linea, el valor del lead serán los puntos creados por la función
                lead = linear_lead_in(points, kerf=1.5, clockwise=is_outer)     #linear_lead_in
                line = 1 

            else:
                lead = circular_lead_in(points[0], clockwise=is_outer)          #Si es un círculo, el valor del lead serán los puntos creados por la función
                for pt in lead[1:]:                                             #circular_lead_in
                    gcode.append(f"G1 X{pt[0]:.3f} Y{pt[1]:.3f}")# F600")

            # Lead in
            gcode.append(f"( {kind} corte - {entity.dxftype()} )")              #Escribe que tipo de corte se realizará
            if line == 1:
                gcode.append(f"G0 X{lead[0][0]:.3f} Y{lead[0][1]:.3f}")         #Usa G00 para posicionamiento rápido en el inicio de la instrucción
            else:
                gcode.append(f"G0 X{lead[-1][0]:.3f} Y{lead[-1][1]:.3f}")
            gcode.append("M03 ; plasma ON")                                     #Energiza el cortador de plasma

            # Contorno principal
            for pt in points:                                                   #Empieza a escribir todos los movimientos con G01, con corte
                gcode.append(f"G1 X{pt[0]:.3f} Y{pt[1]:.3f}") #F600")

            # Cierra figura si es polígono
            # if len(points) > 2 and points[0] != points[-1]:
            #     gcode.append(f"G1 X{points[0][0]:.3f} Y{points[0][1]:.3f}")

            # Apagar compensación
            # gcode.append("G40 ; cancelar compensación")
            gcode.append("M05 ; plasma OFF")                                    #Al terminar, desenergiza el cortador
            # gcode.append("G0 Z5")

    gcode.append("M30 ; fin")                                                   #Cuando ya no hallan más instrucciones, finaliza el programa
    return (gcode)

predet = 25                                                                     #Valores predeterminados de velocidad VJ
velocidades = predet

def gcode_a_yaskawa(gcode_lines, z_altura, velocidad, nombre_base, output_dir, uf, ut, pc, velocidadj):     #Traducción del codigo G a inform 2
    nombre_archivo = f"{nombre_base}"                                           #Da al JOB el nombre del archivo                                 
    jbi_path = os.path.join(output_dir, f"{nombre_archivo}.JBI")                #Dirección y tipo de archivo del programa inform 2 (del robot)
    g_path = os.path.join(output_dir, f"{nombre_archivo}.gcode")                #Dirección y tipo de archivo del código G

    try:
        with open(g_path, "w") as gf:                                           #Abre el archivo del código G para empezar a traducirlo
            gf.write("\n".join(gcode_lines))

        with open(jbi_path, "w") as f:                                                  #Abre el archivo del inform 2 para empezar a escribir
            f.write("/JOB\n")                                                           #Indica tipo de archivo
            f.write(f"//NAME {nombre_archivo.upper()}\n")                               #Nombre del JOB
            f.write("//POS\n")                                                          #Indica posiciones
            total_pos = sum(1 for line in gcode_lines if line.startswith("G")) -2          #Determina el número total de posiciones
            f.write(f"///NPOS {total_pos},0,0,0,0,0\n")                                 #Número total de posiciones

            f.write(f"///TOOL {ut}\n")                                                  #Número de herramienta
            f.write(f"///USER {uf}\n")                                                  #Número de usuario
            f.write("///POSTYPE USER\n")                                                #Indica el tipo de movimiento (Usuario en este caso)
            f.write("///RECTAN \n")                                                     #Indica las unidades (milimetros en este caso)
            f.write("///RCONF 1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n")       #Configuraciones del robot (Por investigar a fondo)

            idx = 0                                                     
            posiciones = []                                         
            for i, line in enumerate(gcode_lines):                                      #Genera las coordenadas y su número correspondiente
                if line.startswith("G0") or line.startswith("G1"):                      #Identifica si es G0 o G1
                    parts = line.split()
                    coords = {p[0]: float(p[1:]) for p in parts[1:] if p[0] in "XY"}
                    x = round(coords.get("X", 0.0), 4)                                  #Redondea los valores a cuatro decimales
                    y = round(coords.get("Y", 0.0), 4)
                    z = round(z_altura, 4)
                    posiciones.append((x, y, z))
                    f.write(f"C{idx:05d}={x},{y},{z},0,0,0\n")                          #Escribe los valores acomodados
                    idx += 1

            f.write("//INST\n")                                                         #Instrucciones
            f.write(f"///DATE {datetime.now().strftime('%Y/%m/%d %H:%M')}\n")           #Fecha
            f.write("///ATTR SC,RW,RJ\n")                                               #Shared constant, read/write y Relative Job
            f.write("////FRAME USER 1\n")                                               #User frame 1
            f.write("///GROUP1 RB1\n")                                                  #Grupo de coordenadas
            f.write("NOP\n")
            #Escribe los movimientos, junto con el prendido y apagado de la antorcha y timers
            if velocidades == predet:                                                   
                j = 0
                i = 0
                while i < len(gcode_lines):                                                 
                    line = gcode_lines[i]
                    if line.startswith("G0"):                                           #Si lee un G0, escribe un MOVJ con VJ
                        f.write(f"MOVJ C{j:05d} VJ={velocidadj}\n")
                        j += 1
                    elif line.startswith("G1"):                                         #Si lee un G1, escribe un MOVL con V
                        f.write(f"MOVL C{j:05d} V={velocidad} PL=0\n")
                        j += 1
                    elif line.startswith("M03"):                                        #Si lee un M03, escribe el encendido de la antorcha y 
                        f.write(f"DOUT OT#({pc}) ON\n")                                 #Agrega un pequeño timer de 1 segundo
                        f.write(f"TIMER T=1.000\n")
                    elif line.startswith("M05"):                                        #Si lee un M05, apaga la antorcha con un timer
                        f.write(f"DOUT OT#({pc}) OFF\n")
                        f.write(f"TIMER T=1.000\n")
                    else:
                        pass  # No se incrementa j                                      #Si no lee nada, pasa a la siguiente línea
                    i += 1  # Siempre pasa a la siguiente línea

                    
            f.write(f"DOUT OT#({pc}) OFF\n")                                            #Al final del programa, apaga la antorcha
            f.write("END\n")                                                            #Fin del programa

        return jbi_path, g_path 
    except Exception as e:
        raise e

class GestorFTP:                                                                        #Crea la función para la conexión FTP
    def __init__(self):
        self.ftp = ftplib.FTP(FTP_HOST)                                                 #Configura el usuario en el servidor
        self.ftp.login(FTP_USER, FTP_PASS)
        self.directorio_actual = "/"

    def listar_archivos(self):                                                          #Crea la lista de archivos que estan en el robot
        self.ftp.cwd(self.directorio_actual)
        return self.ftp.nlst()

    def cambiar_directorio(self, nuevo):                                                #Cambia la carpeta donde se está actualmente
        if nuevo == "..":
            self.ftp.cwd("..")
        else:
            self.ftp.cwd(nuevo)
        self.directorio_actual = self.ftp.pwd()

    def subir_archivo(self, local_path):                                                #Sube un archivo desde la memoria del PC
        with open(local_path, 'rb') as file:
            self.ftp.storbinary(f"STOR {os.path.basename(local_path)}", file)

    def descargar_archivo(self, nombre, destino):                                       #Descarga un archivo del robot al PC
        with open(destino, 'wb') as f:
            self.ftp.retrbinary(f"RETR {nombre}", f.write)

    def eliminar_archivo(self, nombre):                                                 #Elimina un archivo de la memoria del robot
        self.ftp.delete(nombre)

    def cerrar(self):                                                                   #Cierra la conexión
        self.ftp.quit()

def gestionar_archivos_ftp():                                                           #Función para administrar los archivos
    try:
        gestor = GestorFTP()                                                             
        ventana = tk.Toplevel()
        ventana.title("Gestión de Archivos en Robot")

        listbox = tk.Listbox(ventana, width=60)
        listbox.pack(padx=10, pady=10, fill="both", expand=True)

        def actualizar_lista():                                                         #Actualización de la lista al subir un archivo o cambiar
            listbox.delete(0, tk.END)                                                   #De dierctorio
            try:
                archivos = gestor.listar_archivos()
                listbox.insert(tk.END, "[..] Subir archivo desde PC")
                listbox.insert(tk.END, "[..] Ir al directorio superior")
                for archivo in archivos:
                    listbox.insert(tk.END, archivo)
            except Exception as e:
                messagebox.showerror("FTP Error", f"No se pudo listar archivos: {e}")   #Error que regresa al no poder listar los archivos

        def al_seleccionar(event=None):                                                 #Función para subir archivos
            seleccionado = listbox.get(tk.ACTIVE)
            if seleccionado == "[..] Subir archivo desde PC":                           #Si se da click en subir archivos:
                local = filedialog.askopenfilename()                                    #Abre el explorador de archivos
                if local:
                    try:
                        gestor.subir_archivo(local)                                     #Sube el archivo que se seleccionó
                        actualizar_lista()                                              #Llama a la función para actualizar la lista
                        messagebox.showinfo("Subida", f"'{os.path.basename(local)}' subido correctamente.") #Muestra el mensaje que confirma que se subió
                    except Exception as e:                                                                  #El archivo
                        messagebox.showerror("Error de subida", str(e))                 #Si ocurre un error, te muestra el mensaje señalandolo
            elif seleccionado == "[..] Ir al directorio superior":                      #Si se selecciona "Ir al directorio superior"
                gestor.cambiar_directorio("..")                                         #Regresa al directorio superior
                actualizar_lista()                                                      #Actualiza la lista
            elif "." not in seleccionado:  # Probable carpeta                           #Al seleccionar una carpeta, la abre
                try:
                    gestor.cambiar_directorio(seleccionado)
                    actualizar_lista()
                except:
                    pass

        def eliminar():                                                                 #Función para eliminar archivos
            seleccionado = listbox.get(tk.ACTIVE)                                       #Selecciona la opción activa
            if seleccionado.startswith("[..]"):                                         #Si empieza con los 2 puntos, no hace nada
                return
            if messagebox.askyesno("Eliminar", f"¿Eliminar '{seleccionado}' del robot?"):   #Despliega una ventanilla donde te pregunte si deseas elimnarlo
                gestor.eliminar_archivo(seleccionado)                                   #Elimina el archivo seleccionado
                actualizar_lista()                                                      #Actualiza la lista

        def guardar():                                                                  #Función para guardar un archivo del robot en el PC
            seleccionado = listbox.get(tk.ACTIVE)                                       #Selecciona la opción activa
            if seleccionado.startswith("[..]"):                                         #Si empieza con los 2 puntos, no hace nada      
                return
            destino = filedialog.asksaveasfilename(defaultextension=".JBI", initialfile=seleccionado)
            if destino:                                                                 
                gestor.descargar_archivo(seleccionado, destino)
                messagebox.showinfo("Guardar", f"Archivo guardado en {destino}")

        listbox.bind("<Double-Button-1>", al_seleccionar)

        tk.Button(ventana, text="Eliminar", command=eliminar).pack(pady=5)
        tk.Button(ventana, text="Guardar", command=guardar).pack(pady=5)

        actualizar_lista()

        ventana.protocol("WM_DELETE_WINDOW", lambda: [gestor.cerrar(), ventana.destroy()])
    except Exception as e:
        messagebox.showerror("FTP Error", f"Error al conectar: {e}")

# GUI principal
def crear_gui():
    ventana = tk.Tk()
    ventana.title("Convertidor DXF a YASKAWA")
    ventana.configure(bg="white")
    ventana.geometry("500x800")

    try:
        logo_img = Image.open("yaskawa_logo.png")
        logo_img = logo_img.resize((200, 60), Image.ANTIALIAS)
        logo = ImageTk.PhotoImage(logo_img)
        logo_label = tk.Label(ventana, image=logo, bg="white")
        logo_label.image = logo
        logo_label.pack(pady=10)
    except:
        tk.Label(ventana, text="YASKAWA", font=("Arial", 24), bg="white", fg="#003366").pack(pady=10)

    ruta_var = tk.StringVar()

    def seleccionar_archivo():
        archivo = filedialog.askopenfilename(filetypes=[("Archivos DXF", "*.dxf")])
        if archivo:
            ruta_var.set(archivo)

    tk.Button(ventana, text="Seleccionar archivo DXF", command=seleccionar_archivo, bg="#003366", fg="white", relief="flat").pack(pady=10)
    tk.Entry(ventana, textvariable=ruta_var, width=50, relief="solid").pack(pady=5)

    tk.Label(ventana, text="Altura Z (mm):", bg="white").pack(pady=(20, 5))
    z_entry = tk.Entry(ventana, width=10, relief="solid")
    z_entry.pack()
    z_entry.insert(0, "7")

    tk.Label(ventana, text="User Frame (UF#):", bg="white").pack(pady=(10, 5))
    uf_entry = tk.Entry(ventana, width=10, relief="solid")
    uf_entry.pack()
    uf_entry.insert(0, "1")

    tk.Label(ventana, text="Tool (UT#):", bg="white").pack(pady=(10, 5))
    ut_entry = tk.Entry(ventana, width=10, relief="solid")
    ut_entry.pack()
    ut_entry.insert(0, "0")

    tk.Label(ventana, text="Velocidad (V):", bg="white").pack(pady=(10, 5))
    v_entry = tk.Entry(ventana, width=10, relief="solid")
    v_entry.pack()
    v_entry.insert(0, velocidades)

    tk.Label(ventana, text="Velocidad (VJ):", bg="white").pack(pady=(10, 5))
    vj_entry = tk.Entry(ventana, width=10, relief="solid")
    vj_entry.pack()
    vj_entry.insert(0, "15") 

    def leer_datos_csv(nombre_archivo):
        """Lee los datos desde un archivo CSV y devuelve encabezados y datos."""
        encabezados = []
        datos = []
        try:
            with open(nombre_archivo, 'r', newline='', encoding='utf-8') as archivo_csv:
                lector_csv = csv.reader(archivo_csv)
                encabezados = next(lector_csv)  # La primera línea son los encabezados
                for fila in lector_csv:
                    datos.append(fila)
        except FileNotFoundError:
            print(f"Error: El archivo '{nombre_archivo}' no se encontró.")
        return encabezados, datos

    def crear_tabla(parent, encabezados, datos):
        """Crea y devuelve un widget Treeview con encabezados y datos."""
        tabla = ttk.Treeview(parent, columns=encabezados, show="headings", selectmode="extended")

        for col in encabezados:
            tabla.heading(col, text=col)
            tabla.column(col, width=120, anchor=tk.CENTER)

        for fila in datos:
            tabla.insert("", tk.END, values=fila)

        # Añadir barras de desplazamiento a la tabla
        scrollbar_vertical = ttk.Scrollbar(parent, orient="vertical", command=tabla.yview)
        tabla.configure(yscrollcommand=scrollbar_vertical.set)
        scrollbar_vertical.pack(side="right", fill="y")

        scrollbar_horizontal = ttk.Scrollbar(parent, orient="horizontal", command=tabla.xview)
        tabla.configure(xscrollcommand=scrollbar_horizontal.set)
        scrollbar_horizontal.pack(side="bottom", fill="x")

        return tabla

    def mostrar_tabla_seleccionable(encabezados, datos):
        """Crea una nueva ventana con la tabla y un botón para obtener la selección."""
        ventana_tabla = Toplevel(ventana)
        ventana_tabla.title("Tabla Seleccionable")

        tabla = crear_tabla(ventana_tabla, encabezados, datos)
        tabla.pack(padx=10, pady=10, fill=tk.BOTH, expand=True)

        def obtener_seleccion():
            """Obtiene los IDs de las filas seleccionadas y muestra sus valores."""
            seleccionados = tabla.selection()
            if seleccionados:
                valores = tabla.item(seleccionados[0], 'values')
                try:
                    # Asumimos que la velocidad está en la columna con índice 3
                    velocidades = valores[3]
                    print(f"Velocidad seleccionada: {velocidades}")
                    v_entry.delete(0, 5)
                    v_entry.insert(0, velocidades) 
                except IndexError:
                    print("Error: La columna de velocidad no existe en la fila seleccionada.")

        boton_obtener = Button(ventana_tabla, text="Seleccionar Velocidad", command=obtener_seleccion)
        boton_obtener.pack(pady=10)

    # Nombre del archivo CSV
    nombre_archivo_csv = 'parametros_corte_laser.csv'

    # Leer los datos del archivo CSV
    encabezados_tabla, datos_tabla = leer_datos_csv(nombre_archivo_csv)

    # Botón para mostrar la tabla seleccionable
    boton_mostrar_tabla = Button(ventana, text="Seleccionar velocidad a partir de material",
                                command=lambda: mostrar_tabla_seleccionable(encabezados_tabla, datos_tabla))
    boton_mostrar_tabla.pack(pady=20)

    tk.Label(ventana, text="Entrada cortador de plasma:", bg="white").pack(pady=(10, 5))
    p_entry = tk.Entry(ventana, width=10, relief="solid")
    p_entry.pack()
    p_entry.insert(0, "1")

    tk.Label(ventana, text="Nota: Revise que el ancho y largo de su pieza \n concuerde con las medidas de su user frame.", bg="white").pack(pady=(10, 5))

    tk.Label(ventana, text="Se recomienda crear la pieza en X y Y positivos.", bg="white").pack(pady=(10, 5))

    def iniciar_conversion():
        path = ruta_var.get()
        z_value = z_entry.get()
        uf_value = uf_entry.get()
        ut_value = ut_entry.get()
        v_value = v_entry.get()
        vj_value = vj_entry.get()
        p_value = p_entry.get() 
        try:
            z = float(z_value)
            uf = int(uf_value)
            ut = int(ut_value)
            pc = int(p_value)
            velocidad = float(v_value)
            velocidadj = float(vj_value)
            gcode_lines = generate_gcode_from_dxf(path)
            nombre_base = os.path.splitext(os.path.basename(path))[0]
            output_dir = os.path.dirname(path)
            jbi_path, gcode_path = gcode_a_yaskawa(gcode_lines, z, velocidad, nombre_base, output_dir, uf, ut, pc, velocidadj)
            messagebox.showinfo("Éxito", f"Archivos generados:\n{jbi_path}\n{gcode_path}")
            if messagebox.askyesno("Enviar por FTP", "¿Deseas enviar el archivo JBI al robot ahora?"):
                gestor = GestorFTP()
                gestor.subir_archivo(jbi_path)
                gestor.cerrar()
                messagebox.showinfo("FTP", "Archivo enviado exitosamente al robot.")
        except Exception as e:
            messagebox.showerror("Error", str(e))

    tk.Button(ventana, text="Convertir a YASKAWA", command=iniciar_conversion, bg="#007acc", fg="white", font=("Arial", 12), relief="flat", padx=10, pady=5).pack(pady=30)
    tk.Button(ventana, text="Gestionar Archivos en Robot (FTP)", command=gestionar_archivos_ftp, bg="#444444", fg="white", relief="flat").pack(pady=10)

    ventana.mainloop()

crear_gui()