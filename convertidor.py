import tkinter as tk
from tkinter import filedialog, messagebox
from PIL import Image, ImageTk
import os
import ezdxf
from datetime import datetime
from ftplib import FTP

PULSES_POR_MM = 100

FTP_SERVER = '192.168.1.31'
FTP_USER = 'rcmaster'
FTP_PASS = '9999999999999999'
FTP_DIR = '/JOB'

ftp = None

def login_ftp():
    global ftp
    try:
        ftp = FTP()
        ftp.connect(FTP_SERVER, 21)
        ftp.login(FTP_USER, FTP_PASS)
        ftp.cwd(FTP_DIR)
        print('Conectado al servidor FTP.')
        return ftp
    except Exception as e:
        print(f'Error al conectar con FTP: {e}')
        ftp = None
        return None

def logout_ftp():
    global ftp
    if ftp:
        try:
            ftp.quit()
            print("Sesión FTP cerrada correctamente.")
        except Exception as e:
            print(f"Error al cerrar sesión FTP: {e}")
        finally:
            ftp = None

def subir_archivo_ftp(archivo_local):
    global ftp
    if not ftp:
        ftp = login_ftp()

    if ftp:
        try:
            with open(archivo_local, 'rb') as file:
                nombre_remoto = os.path.basename(archivo_local)
                ftp.storbinary(f'STOR {nombre_remoto}', file)
                print(f"Se subió el archivo correctamente: {nombre_remoto}")
                messagebox.showinfo("Éxito", f"Archivo '{nombre_remoto}' subido exitosamente.")
        except Exception as e:
            messagebox.showerror("Error", f"No se pudo subir el archivo: {e}")
    else:
        messagebox.showerror("Error", "No se pudo conectar al servidor FTP.")

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

def gcode_a_yaskawa(gcode_lines, z_altura, velocidad, nombre_base, output_dir, uf, ut):
    nombre_archivo = f"{nombre_base}"
    jbi_path = os.path.join(output_dir, f"{nombre_archivo}.JBI")
    g_path = os.path.join(output_dir, f"{nombre_archivo}.gcode")

    try:
        with open(g_path, "w") as gf:
            gf.write("\n".join(gcode_lines))

        with open(jbi_path, "w") as f:
            f.write("/JOB\n")
            f.write(f"//NAME {nombre_archivo.upper()}\n")
            f.write("//POS\n")
            total_pos = sum(1 for line in gcode_lines if line.startswith("G"))
            f.write(f"///NPOS {total_pos},0,0,0,0,0\n")
            f.write("///TOOL 0\n")
            f.write(f"///USER 1\n")
            f.write("///POSTYPE USER\n")
            f.write("///RECTAN\n")
            f.write("///RCONF 1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n")

            idx = 0
            for line in gcode_lines:
                if line.startswith("G"):
                    parts = line.split()
                    coords = {p[0]: float(p[1:]) for p in parts[1:] if p[0] in "XY"}
                    x = int(coords.get("X", 0.0) * PULSES_POR_MM)
                    y = int(coords.get("Y", 0.0) * PULSES_POR_MM)
                    z = int(z_altura * PULSES_POR_MM)
                    f.write(f"C{idx:05d}={x},{y},{z},0,0,0\n")
                    idx += 1

            f.write("//INST\n")
            f.write(f"///DATE {datetime.now().strftime('%Y/%m/%d %H:%M')}\n")
            f.write("///ATTR SC,RW,RJ\n")
            f.write("////FRAME USER 1\n")
            f.write("///GROUP1 RB1\n")
            f.write("NOP\n")
            f.write(f"MOVJ C00000 VJ=0.78\n")
            for i in range(1, idx):
                f.write(f"MOVL C{i:05d} V={velocidad}\n")
            f.write("END\n")

        return jbi_path, g_path
    except Exception as e:
        raise e

# interfaz papá
def crear_gui():
    ventana = tk.Tk()
    ventana.title("Convertidor DXF a YASKAWA")
    ventana.geometry("500x650")
    ventana.configure(bg="white")

    def on_close():
        logout_ftp()
        ventana.destroy()

    ventana.protocol("WM_DELETE_WINDOW", on_close)

    ruta_var = tk.StringVar()

    tk.Button(ventana, text="Seleccionar archivo DXF", command=lambda: ruta_var.set(filedialog.askopenfilename(filetypes=[("Archivos DXF", "*.dxf")])), bg="#003366", fg="white", relief="flat").pack(pady=10)
    tk.Entry(ventana, textvariable=ruta_var, width=50, relief="solid").pack(pady=5)

    def iniciar_conversion():
        path = ruta_var.get()
        if not path:
            messagebox.showerror("Error", "No se seleccionó un archivo.")
            return
        nombre_base = os.path.splitext(os.path.basename(path))[0]
        output_dir = os.path.dirname(path)
        gcode_lines = dxf_a_gcode(path)
        jbi_path, _ = gcode_a_yaskawa(gcode_lines, 7, 15, nombre_base, output_dir, 1, 1)
        subir_archivo_ftp(jbi_path)

    tk.Button(ventana, text="Convertir y Subir", command=iniciar_conversion, bg="#007acc", fg="white", font=("Arial", 12)).pack(pady=30)
    ventana.mainloop()

crear_gui()