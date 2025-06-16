import ftplib
import os
import time

FTP_USER = "rcmaster"
FTP_PASS = "9999999999999999"

class GestorFTP:
    def __init__(self):
        self.user = FTP_USER
        self.password = FTP_PASS
        self.directorio_actual = "/JOB"    
    
    def subir_archivo(self, local_path, FTP_HOST):
        file = None
        try:
            self.ftp = ftplib.FTP(FTP_HOST)
            self.ftp.login(self.user, self.password)
            file = open(local_path, 'rb')
            self.ftp.storbinary(f"STOR {os.path.basename(local_path)}", file)
            print(f"Archivo '{os.path.basename(local_path)}' enviado correctamente.")
            time.sleep(2)
        except Exception as e:
            print(f"Error al enviar '{local_path}': {e}")
        finally:
            if file and not file.closed:
                file.close()
                self.ftp.quit()
                print("Archivo cerrado correctamente.")

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
                print(f"eliminaste el archivo {file}")
        lista_jobs = self.ftp.nlst()
        self.ftp.quit()
        return lista_jobs