import tkinter as tk
from tkinter import filedialog, messagebox
from PIL import Image, ImageTk
import os
import ezdxf

# Convertir DXF a GCODE (simplificado)
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

# Convertir GCODE a YASKAWA
def gcode_a_yaskawa(gcode_lines, z_altura, nombre_base, output_dir):
    jbi_path = os.path.join(output_dir, f"{nombre_base}.JBI")  # extensión en mayúsculas
    g_path = os.path.join(output_dir, f"{nombre_base}.gcode")

    try:
        with open(g_path, "w") as gf:
            gf.write("\n".join(gcode_lines))

        with open(jbi_path, "w") as f:
            f.write(f"/PROG {nombre_base}\n")
            f.write("/ATTR\nOWNER = MNEDITOR;\nCOMMENT = ""\n/END\n")
            f.write("/MN\n")
            f.write("   1 SET DO[1]=ON\n")
            step = 2
            for i, line in enumerate(gcode_lines):
                if line.startswith("G0") or line.startswith("G1"):
                    parts = line.split()
                    coords = {p[0]: float(p[1:]) for p in parts[1:] if p[0] in "XY"}
                    x = coords.get("X", 0.0)
                    y = coords.get("Y", 0.0)
                    f.write(f"{step:5d} MOVL P{step:03d} V=100.0 ; X={x:.1f} Y={y:.1f} Z={z_altura:.1f}\n")
                    step += 1
            f.write(f"{step:5d} SET DO[1]=OFF\n")
            f.write("/POS\n")
            idx = 2
            for i, line in enumerate(gcode_lines):
                if line.startswith("G0") or line.startswith("G1"):
                    parts = line.split()
                    coords = {p[0]: float(p[1:]) for p in parts[1:] if p[0] in "XY"}
                    x = coords.get("X", 0.0)
                    y = coords.get("Y", 0.0)
                    f.write(f"P{idx:03d}\n   X={x:.1f} Y={y:.1f} Z={z_altura:.1f}\n")
                    idx += 1
            f.write("/END\n")
        return jbi_path, g_path
    except Exception as e:
        raise e

# GUI
def crear_gui():
    ventana = tk.Tk()
    ventana.title("Convertidor DXF a YASKAWA")
    ventana.configure(bg="white")
    ventana.geometry("500x500")

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

    def iniciar_conversion():
        path = ruta_var.get()
        z_value = z_entry.get()
        try:
            z = float(z_value)
            gcode_lines = dxf_a_gcode(path)
            nombre_base = os.path.splitext(os.path.basename(path))[0]
            output_dir = os.path.dirname(path)
            jbi_path, gcode_path = gcode_a_yaskawa(gcode_lines, z, nombre_base, output_dir)
            messagebox.showinfo("Éxito", f"Archivos generados:\n{jbi_path}\n{gcode_path}")
        except Exception as e:
            messagebox.showerror("Error", str(e))

    tk.Button(ventana, text="Convertir a YASKAWA", command=iniciar_conversion, bg="#007acc", fg="white", font=("Arial", 12), relief="flat", padx=10, pady=5).pack(pady=30)

    ventana.mainloop()

crear_gui()