from ftplib import FTP

ftp = FTP()

password = '9999999999999999'

if ftp.connect('192.168.1.31', 21):
    if ftp.login('rcmaster', password):
        print('se inicio sesion')

        ftp.cwd('/JOB')
        print(f'Directorio actual: {ftp.pwd()}')

        # archivo = 'TRIANGU.JBI'
        # archivo_remoto = 'TRIANGU.JBI'

        # with open(archivo, 'rb') as archivo:
        #     ftp.storbinary(f'STOR {archivo_remoto}', archivo)
        
        # print('Archivo subido con exito')
        ftp.quit()
    else:
        print('error al iniciar sesion')
        ftp.quit()
else:
    print('error con la comunicacion al servidor')
    ftp.quit()