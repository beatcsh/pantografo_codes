import tkinter as tk
from tkinter import filedialog, messagebox
from PIL import Image, ImageTk
import os
import ezdxf
from datetime import datetime
import ftplib

PULSES_POR_MM = 1
FTP_HOST = "192.168.1.31"
FTP_USER = "rcmaster"
FTP_PASS = "9999999999999999"

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

def gcode_a_yaskawa(gcode_lines, z_altura, velocidad, nombre_base, output_dir, uf, ut, pc, velocidadj):
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
            f.write(f"///TOOL {ut}\n")
            f.write(f"///USER {uf}\n")
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
            prev_mov = None  # Ningún tipo de movimiento al inicio
            for j, line in enumerate(gcode_lines):
                if (line.startswith("G0")) and (prev_mov == "MOVJ"):
                    f.write(f"MOVJ C{j:05d} VJ={velocidadj}\n")
                    prev_mov = "MOVJ"
                elif (line.startswith("G1")) and (prev_mov == "MOVJ"):
                    f.write(f"DOUT OT#({pc}) ON\n")
                    f.write(f"MOVL C{j:05d} V={velocidad}\n")
                    prev_mov = "MOVL"
                elif (line.startswith("G1")) and (prev_mov == "MOVL"):
                    f.write(f"MOVL C{j:05d} V={velocidad}\n")
                    prev_mov = "MOVL"
                elif (line.startswith("G0")) and (prev_mov == "MOVL"):
                    f.write(f"DOUT OT#({pc}) OFF\n")
                    f.write(f"MOVJ C{j:05d} VJ={velocidadj}\n")
                    prev_mov = "MOVJ"
                else:
                    f.write(f"MOVJ C{j:05d} VJ={velocidadj}\n")
                    prev_mov="MOVJ"
            f.write(f"DOUT OT#({pc}) OFF\n")
            f.write("END\n")

        return jbi_path, g_path
    except Exception as e:
        raise e

class GestorFTP:
    def __init__(self):
        self.ftp = ftplib.FTP(FTP_HOST)
        self.ftp.login(FTP_USER, FTP_PASS)
        self.directorio_actual = "/"

    def listar_archivos(self):
        self.ftp.cwd(self.directorio_actual)
        return self.ftp.nlst()

    def cambiar_directorio(self, nuevo):
        if nuevo == "..":
            self.ftp.cwd("..")
        else:
            self.ftp.cwd(nuevo)
        self.directorio_actual = self.ftp.pwd()

    def subir_archivo(self, local_path):
        with open(local_path, 'rb') as file:
            self.ftp.storbinary(f"STOR {os.path.basename(local_path)}", file)

    def descargar_archivo(self, nombre, destino):
        with open(destino, 'wb') as f:
            self.ftp.retrbinary(f"RETR {nombre}", f.write)

    def eliminar_archivo(self, nombre):
        self.ftp.delete(nombre)

    def cerrar(self):
        self.ftp.quit()

def gestionar_archivos_ftp():
    try:
        gestor = GestorFTP()
        ventana = tk.Toplevel()
        ventana.title("Gestión de Archivos en Robot")

        listbox = tk.Listbox(ventana, width=60)
        listbox.pack(padx=10, pady=10, fill="both", expand=True)

        def actualizar_lista():
            listbox.delete(0, tk.END)
            try:
                archivos = gestor.listar_archivos()
                listbox.insert(tk.END, "[..] Subir archivo desde PC")
                listbox.insert(tk.END, "[..] Ir al directorio superior")
                for archivo in archivos:
                    listbox.insert(tk.END, archivo)
            except Exception as e:
                messagebox.showerror("FTP Error", f"No se pudo listar archivos: {e}")

        def al_seleccionar(event=None):
            seleccionado = listbox.get(tk.ACTIVE)
            if seleccionado == "[..] Subir archivo desde PC":
                local = filedialog.askopenfilename()
                if local:
                    try:
                        gestor.subir_archivo(local)
                        actualizar_lista()
                        messagebox.showinfo("Subida", f"'{os.path.basename(local)}' subido correctamente.")
                    except Exception as e:
                        messagebox.showerror("Error de subida", str(e))
            elif seleccionado == "[..] Ir al directorio superior":
                gestor.cambiar_directorio("..")
                actualizar_lista()
            elif "." not in seleccionado:  # Probable carpeta
                try:
                    gestor.cambiar_directorio(seleccionado)
                    actualizar_lista()
                except:
                    pass

        def eliminar():
            seleccionado = listbox.get(tk.ACTIVE)
            if seleccionado.startswith("[..]"):
                return
            if messagebox.askyesno("Eliminar", f"¿Eliminar '{seleccionado}' del robot?"):
                gestor.eliminar_archivo(seleccionado)
                actualizar_lista()

        def guardar():
            seleccionado = listbox.get(tk.ACTIVE)
            if seleccionado.startswith("[..]"):
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

    tk.Label(ventana, text="Velocidad (VJ):", bg="white").pack(pady=(10, 5))
    vj_entry = tk.Entry(ventana, width=10, relief="solid")
    vj_entry.pack()
    vj_entry.insert(0, "85.0") 

    tk.Label(ventana, text="Entrada cortador de plasma:", bg="white").pack(pady=(10, 5))
    p_entry = tk.Entry(ventana, width=10, relief="solid")
    p_entry.pack()
    p_entry.insert(0, "0")

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
            gcode_lines = dxf_a_gcode(path)
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