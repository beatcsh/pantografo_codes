import ftplib
import time
import os
import socket
import subprocess

FTP_USER = "rcmaster"
FTP_PASS = "9999999999999999"

def obtener_ip_host():
    # se obtiene la ip del host (computadora fisica)
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    finally:
        s.close()
    return ip

class GestorFTP:

    def __init__(self):
        self.user = FTP_USER
        self.password = FTP_PASS
        self.directorio_actual = "/JOB"

    def subir_archivo(self, local_path, FTP_HOST):
        nombre_archivo = os.path.basename(local_path)

        # se construye un bloque de comandos
        comandos_ftp = f"""open {FTP_HOST}
user {self.user} {self.password}
cd {self.directorio_actual}
put "{local_path}"
bye
"""

        # se ejecuta ftp de entrada, se mantienen logs de alerta para mantenimiento
        try:
            print(f"Ejecutando conexion a {FTP_HOST} ...")
            process = subprocess.run(
                ["ftp", "-n"], 
                input=comandos_ftp.encode(), 
                stdout=subprocess.PIPE, 
                stderr=subprocess.PIPE
            )
            if process.returncode == 0:
                listota = self.listar_archivos(FTP_HOST)
                encontrado = False
                for archivo in listota:
                    if archivo == nombre_archivo:
                        encontrado = True
                if encontrado:
                    print("Archivo subido.")
                else:
                    print("No")
            else:
                print("Error en FTP")
                print(process.stderr.decode())

        except Exception as e:
            print(f"Error ejecutando FTP: {e}")

    def listar_archivos(self, FTP_HOST):
        self.ftp = ftplib.FTP(FTP_HOST)
        self.ftp.login(self.user, self.password)
        self.ftp.cwd(self.directorio_actual)
        archivos = self.ftp.nlst()
        self.ftp.quit()
        return archivos

    def eliminar_archivo(self, idx, FTP_HOST):
        i = int(idx)
        self.ftp = ftplib.FTP(FTP_HOST)
        self.ftp.login(self.user, self.password)
        self.ftp.cwd(self.directorio_actual)
        lista_jobs = self.ftp.nlst()
        for pos, file in enumerate(lista_jobs):
            print(f"[{pos}] {file}")
            if i == pos:
                self.ftp.delete(file)
                print(f"Eliminaste el archivo {file}")
        lista_jobs = self.ftp.nlst()
        self.ftp.quit()
        return lista_jobs