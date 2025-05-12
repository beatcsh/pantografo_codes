import tkinter as tk
from tkinter import filedialog, messagebox
from PIL import Image, ImageTk
import os
import ezdxf
from datetime import datetime
import ftplib

PULSES_POR_MM = 100
FTP_HOST = "192.168.1.31"
FTP_USER = "rcmaster"
FTP_PASS = "9999999999999999"

# DXF a GCODE (simplificado)
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

# GCODE a JBI (YASKAWA)
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
            f.write("///RECTAN \n")
            f.write("///RCONF 1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n")

            idx = 0
            posiciones = []
            for i, line in enumerate(gcode_lines):
                if line.startswith("G0") or line.startswith("G1"):
                    parts = line.split()
                    coords = {p[0]: float(p[1:]) for p in parts[1:] if p[0] in "XY"}
                    x = int(coords.get("X", 0.0) * PULSES_POR_MM)
                    y = int(coords.get("Y", 0.0) * PULSES_POR_MM)
                    z = int(z_altura * PULSES_POR_MM)
                    posiciones.append((x, y, z))
                    f.write(f"C{idx:05d}={x},{y},{z},0,0,0\n")
                    idx += 1

            f.write("//INST\n")
            f.write(f"///DATE {datetime.now().strftime('%Y/%m/%d %H:%M')}\n")
            f.write("///ATTR SC,RW,RJ\n")
            f.write("////FRAME USER 1\n")
            f.write("///GROUP1 RB1\n")
            f.write("NOP\n")
            f.write(f"MOVJ C00000 VJ=0.78\n")
            for i in range(1, len(posiciones)):
                f.write(f"MOVL C{i:05d} V={velocidad}\n")
            f.write("END\n")

        return jbi_path, g_path
    except Exception as e:
        raise e

# Enviar archivo al robot por FTP
def enviar_archivo_ftp(filepath):
    try:
        with ftplib.FTP(FTP_HOST) as ftp:
            ftp.login(FTP_USER, FTP_PASS)
            with open(filepath, 'rb') as file:
                ftp.storbinary(f"STOR {os.path.basename(filepath)}", file)
        messagebox.showinfo("FTP", "Archivo enviado exitosamente al robot.")
    except Exception as e:
        messagebox.showerror("FTP Error", f"No se pudo enviar el archivo: {e}")

# Administrador manual de archivos vía FTP
def gestionar_archivos_ftp():
    try:
        with ftplib.FTP(FTP_HOST) as ftp:
            ftp.login(FTP_USER, FTP_PASS)
            archivos = ftp.nlst()
            ventana = tk.Toplevel()
            ventana.title("Gestión de Archivos en Robot")

            listbox = tk.Listbox(ventana, width=50)
            listbox.pack(padx=10, pady=10)

            for archivo in archivos:
                listbox.insert(tk.END, archivo)

            def eliminar():
                seleccionado = listbox.get(tk.ACTIVE)
                if messagebox.askyesno("Eliminar", f"¿Eliminar '{seleccionado}' del robot?"):
                    ftp.delete(seleccionado)
                    listbox.delete(tk.ACTIVE)

            def guardar():
                seleccionado = listbox.get(tk.ACTIVE)
                destino = filedialog.asksaveasfilename(defaultextension=".JBI", initialfile=seleccionado)
                if destino:
                    with open(destino, 'wb') as f:
                        ftp.retrbinary(f"RETR {seleccionado}", f.write)
                    messagebox.showinfo("Guardar", f"Archivo guardado en {destino}")

            tk.Button(ventana, text="Eliminar", command=eliminar).pack(pady=5)
            tk.Button(ventana, text="Guardar", command=guardar).pack(pady=5)
    except Exception as e:
        messagebox.showerror("FTP Error", f"Error al conectar: {e}")

# GUI principal
def crear_gui():
    ventana = tk.Tk()
    ventana.title("Convertidor DXF a YASKAWA")
    ventana.configure(bg="white")
    ventana.geometry("500x680")

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
    ut_entry.insert(0, "1")

    tk.Label(ventana, text="Velocidad (V):", bg="white").pack(pady=(10, 5))
    v_entry = tk.Entry(ventana, width=10, relief="solid")
    v_entry.pack()
    v_entry.insert(0, "15")

    def iniciar_conversion():
        path = ruta_var.get()
        z_value = z_entry.get()
        uf_value = uf_entry.get()
        ut_value = ut_entry.get()
        v_value = v_entry.get()
        try:
            z = float(z_value)
            uf = int(uf_value)
            ut = int(ut_value)
            velocidad = float(v_value)
            gcode_lines = dxf_a_gcode(path)
            nombre_base = os.path.splitext(os.path.basename(path))[0]
            output_dir = os.path.dirname(path)
            jbi_path, gcode_path = gcode_a_yaskawa(gcode_lines, z, velocidad, nombre_base, output_dir, uf, ut)
            messagebox.showinfo("Éxito", f"Archivos generados:\n{jbi_path}\n{gcode_path}")
            if messagebox.askyesno("Enviar por FTP", "¿Deseas enviar el archivo JBI al robot ahora?"):
                enviar_archivo_ftp(jbi_path)
        except Exception as e:
            messagebox.showerror("Error", str(e))

    tk.Button(ventana, text="Convertir a YASKAWA", command=iniciar_conversion, bg="#007acc", fg="white", font=("Arial", 12), relief="flat", padx=10, pady=5).pack(pady=30)

    tk.Button(ventana, text="Gestionar Archivos en Robot (FTP)", command=gestionar_archivos_ftp, bg="#444444", fg="white", relief="flat").pack(pady=10)

    ventana.mainloop()

crear_gui()
