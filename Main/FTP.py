import tkinter as tk
from tkinter import filedialog, messagebox, ttk
from tkinter import Toplevel, Button     
import os
import ftplib 

#Configuración de usuario para entrar al servidor del robot
FTP_HOST = "192.168.1.31"                                   #IP del servidor                                
FTP_USER = "rcmaster"                                       #Nombre de usuario con todos los privilegios
FTP_PASS = "9999999999999999"                               #Contraseña del modo mantenimiento

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