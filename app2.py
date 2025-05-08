import tkinter as tk
from tkinter import filedialog, messagebox
from PIL import Image, ImageTk
import os
import ezdxf
from datetime import datetime

# FACTOR DE CONVERSIÓN: mm a pulses (defínelo según tu robot)
PULSES_POR_MM = 100  # Ajusta este valor según tu sistema

# Convertir DXF a GCODE (simplificado)
def dxf_a_gcode(dxf_path):
    doc = ezdxf.readfile(dxf_path)
    msp = doc.modelspace()
    gcode_lines = []
    for e in msp:
        if e.dxftype() == 'LINE':
            start = e.dxf.start
            end = e.dxf.end
            gcode_lines.append((start, end))
    return gcode_lines

# Convertir GCODE a YASKAWA (relativo, con marco de usuario)
def gcode_a_yaskawa(gcode_lines, z_altura, velocidad, nombre_base, output_dir):
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    nombre_base_con_fecha = f"{nombre_base}{timestamp}"
    jbi_path = os.path.join(output_dir, f"{nombre_base_con_fecha}.JBI")  # extensión en mayúsculas

    try:
        with open(jbi_path, "w") as f:
            # Encabezado del archivo
            f.write(f"/JOB\n")
            f.write(f"//NAME {nombre_base_con_fecha}\n")
            f.write("//POS\n")
            f.write(f"///NPOS {len(gcode_lines) + 1},0,0,0,0,0\n")
            f.write("///TOOL 0\n///POSTYPE PULSE\n///PULSE\n")
            
            # Generación de posiciones en formato PULSE
            f.write("C00000=0,0,0,0,0,0\n")  # Punto inicial (ajusta si es necesario)
            
            for idx, (start, end) in enumerate(gcode_lines):
                x = int(start[0] * PULSES_POR_MM)
                y = int(start[1] * PULSES_POR_MM)
                z = int(z_altura * PULSES_POR_MM)
                f.write(f"C{idx + 1:05d}={x},{y},{z},0,0,0\n")
            
            # Instrucciones
            f.write("//INST\n")
            f.write(f"///DATE {datetime.now().strftime('%Y/%m/%d %H:%M')}\n")
            f.write("///ATTR SC,RW\n///GROUP1 RB1\nNOP\n")
            f.write(f"MOVJ C00000 VJ={velocidad}\n")

            # MOVL para los demás puntos
            for idx in range(1, len(gcode_lines) + 1):
                f.write(f"MOVL C{idx:05d} V={velocidad}\n")

            # Fin del programa
            f.write("END\n")
            
        return jbi_path
    except Exception as e:
        raise e

# GUI
def crear_gui():
    ventana = tk.Tk()
    ventana.title("Convertidor DXF a YASKAWA")
    ventana.configure(bg="white")
    ventana.geometry("500x650")

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
    z_entry.insert(0, "50")

    tk.Label(ventana, text="Velocidad (V):", bg="white").pack(pady=(10, 5))
    v_entry = tk.Entry(ventana, width=10, relief="solid")
    v_entry.pack()
    v_entry.insert(0, "100.0")

    def iniciar_conversion():
        path = ruta_var.get()
        z_value = z_entry.get()
        v_value = v_entry.get()
        
        try:
            z = float(z_value)
            velocidad = float(v_value)
            gcode_lines = dxf_a_gcode(path)
            nombre_base = os.path.splitext(os.path.basename(path))[0]
            output_dir = os.path.dirname(path)
            jbi_path = gcode_a_yaskawa(gcode_lines, z, velocidad, nombre_base, output_dir)
            messagebox.showinfo("Éxito", f"Archivo generado:\n{jbi_path}")
        except Exception as e:
            messagebox.showerror("Error", str(e))

    tk.Button(ventana, text="Convertir a YASKAWA", command=iniciar_conversion, bg="#007acc", fg="white", font=("Arial", 12), relief="flat", padx=10, pady=5).pack(pady=30)

    ventana.mainloop()

crear_gui()
