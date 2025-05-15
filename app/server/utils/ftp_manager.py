import ftplib
import os
import time

FTP_HOST = "192.168.1.31"
FTP_USER = "rcmaster"
FTP_PASS = "9999999999999999"

class GestorFTP:
    def __init__(self):
        self.ftp = ftplib.FTP(FTP_HOST)
        self.ftp.login(FTP_USER, FTP_PASS)
        self.directorio_actual = "/JOB"    
    
    def subir_archivo(self, local_path):
        file = None
        try:
            file = open(local_path, 'rb')
            self.ftp.storbinary(f"STOR {os.path.basename(local_path)}", file)
            print(f"Archivo '{os.path.basename(local_path)}' enviado correctamente.")
            time.sleep(2)
        except Exception as e:
            print(f"Error al enviar '{local_path}': {e}")
        finally:
            if file and not file.closed:
                file.close()
                print("Archivo cerrado correctamente.")
    
    def cerrar_conexion(self):
        try:
            self.ftp.quit()
            print("Conexión FTP cerrada correctamente.")
        except Exception as e:
            print(f"Error al cerrar la conexión FTP: {e}")
            self.ftp.close

    def listar_archivos(self):
        self.ftp.cwd(self.directorio_actual)
        return self.ftp.nlst()
    
    def eliminar_archivo(self, idx):
        i = int(idx)
        self.ftp.cwd(self.directorio_actual)
        lista_jobs = self.ftp.nlst()
        for pos, file in enumerate(lista_jobs):
            print(f"[{pos}] {file}")
            if i == pos:
                self.ftp.delete(file)
                print(f"eliminaste el archivo {file}")
        lista_jobs = self.ftp.nlst()
        return lista_jobs