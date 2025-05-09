import tkinter as tk
from tkinter import filedialog, messagebox
from PIL import Image, ImageTk
import os
import ezdxf
from datetime import datetime

PULSES_POR_MM = 100

# Convertir DXF a GCODE 
def dxf_a_gcode(dxf_path):
    doc = ezdxf.readfile(dxf_path)
    msp = doc.modelspace()
    gcode_lines = []
    for e in msp:
        if e.dxftype() == 'LINE':
            start = e.dxf.start
            end = e.dxf.end
            gcode_lines.append(f"G0 X{start[0]:.3f} Y{start[1]:.3f}")
            gcode_lines.append(f"G1 X{end[0]:.3f} Y{end[1]:.3f}")
    return gcode_lines

# sacar coordenadas
def sacar_coordenadas(gcode_lines, z):
    # generar coordenadas a partir del gcode
    coord_rectan = []
    for line in gcode_lines:
        # solo toma movimientos
        if line.startswith("G1") or line.startswith("G0"): 
        # obetenion de coordenadas y remplazo de X y Y
            coords = line.split(' ')[1:]  
            x = float(coords[0][1:])  
            y = float(coords[1][1:])  
            coord_rectan.append(f"{x*1000:.0f},{y*1000:.0f},{z},0,0,0")
    return coord_rectan

# Convertir GCODE a YASKAWA --- plasma
def gcode_a_yaskawa_plasma(gcode_lines, nombre_base, output_dir,velocidad, z):
    jbi_path = os.path.join(output_dir, f"{nombre_base}.JBI")
    gcode_path = os.path.join(output_dir, f"{nombre_base}.gcode") # especificacion de la ruta

    try:
        with open(gcode_path, "w") as gf:
            gf.write("\n".join(gcode_lines))

        with open(jbi_path, "w") as f:

            coord_rectan = sacar_coordenadas(gcode_lines, z)

            f.write("/JOB\n")
            f.write(f"//NAME {nombre_base.upper()[:8]}\n")
            f.write("//POS\n")
            f.write(f"///NPOS {len(coord_rectan) + 1},0,0,0,0,0\n")
            f.write("///TOOL 0\n")
            f.write("///POSTYPE PULSE\n")  # Rectan o pulse?
            f.write("///PULSE\n")
            # f.write("///RCONF 1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n")

            f.write("C00000=0,0,0,0,0,0\n")

            for idx, coord in enumerate(coord_rectan):
                f.write(f"C{idx + 1:05d}={coord}\n")

            # Instrucciones
            f.write("//INST\n")
            f.write(f"///DATE {datetime.now().strftime('%Y/%m/%d %H:%M')}\n")
            f.write("///ATTR SC,RW\n///GROUP1 RB1\nNOP\n")
            f.write(f"MOVJ C00000 VJ={velocidad}\n")

            # comandos de movimiento
            f.write("MOVJ C00000 VJ=25.00\n")
            for idx in range(1, len(coord_rectan) - 1):
                f.write(f"MOVL C{idx:05d} V=83.3\n")
            f.write(f"MOVJ C{len(coord_rectan)-1:05d} VJ=25.00\n")
            f.write("END\n")

        return jbi_path, gcode_path
    except Exception as e:
        raise e

# GUI
def crear_gui():
    ventana = tk.Tk()
    ventana.title("Convertidor DXF a YASKAWA (Plasma)")
    ventana.configure(bg="white")
    ventana.geometry("700x700")

    # Logo
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
    z_entry.insert(0, "50")

    tk.Label(ventana, text="Velocidad (V):", bg="white").pack(pady=(10, 5))
    v_entry = tk.Entry(ventana, width=10, relief="solid")
    v_entry.pack()
    v_entry.insert(0, "100.0")

    def iniciar_conversion():
        path = ruta_var.get()
        z_value = z_entry.get()
        v_value = v_value.get()
        try:
            z = float(z_value)
            velocidad = float(v_value)
            gcode_lines = dxf_a_gcode(path)
            nombre_base = os.path.splitext(os.path.basename(path))[0]
            output_dir = os.path.dirname(path)
            jbi_path, gcode_path = gcode_a_yaskawa_plasma(gcode_lines, nombre_base, output_dir, velocidad, z)
            messagebox.showinfo("Éxito", f"Archivos generados:\n{jbi_path}\n{gcode_path}")
        except Exception as e:
            messagebox.showerror("Error", str(e))

    tk.Button(ventana, text="Convertir a JBI (Plasma)", command=iniciar_conversion, bg="#007acc", fg="white", font=("Arial", 12), relief="flat", padx=10, pady=5).pack(pady=30)

    ventana.mainloop()

crear_gui()