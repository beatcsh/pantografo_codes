import os
import ezdxf
from datetime import datetime
from utils.ftp_manager import GestorFTP
import math

PULSES_POR_MM = 1

def interpolar_arco(centro, radio, ang_inicio, ang_fin, sentido, num_puntos=10):
    """Interpolación circular para G2 y G3"""
    puntos = []
    paso = (ang_fin - ang_inicio) / num_puntos if sentido == "CW" else (ang_inicio - ang_fin) / num_puntos
    for i in range(num_puntos + 1):
        angulo = ang_inicio + (i * paso) if sentido == "CW" else ang_inicio - (i * paso)
        x = centro[0] + radio * math.cos(angulo)
        y = centro[1] + radio * math.sin(angulo)
        puntos.append((x, y))
    return puntos

def convertir_dxf_a_yaskawa(dxf_path, z_altura, velocidad, nombre_base, output_dir, uf, ut, pc, velocidadj):
    jbi_path = os.path.join(output_dir, f"{nombre_base}.JBI")
    gcode_path = os.path.join(output_dir, f"{nombre_base}.gcode")

    try:
        # Leer archivo DXF
        doc = ezdxf.readfile(dxf_path)
        msp = doc.modelspace()
        posiciones = []

        # === Generar las posiciones desde el DXF ===
        for e in msp:
            if e.dxftype() == 'LINE':
                start = e.dxf.start
                end = e.dxf.end
                posiciones.append((start[0], start[1], z_altura))
                posiciones.append((end[0], end[1], z_altura))

            elif e.dxftype() == 'ARC':
                center = e.dxf.center
                radius = e.dxf.radius
                start_angle = math.radians(e.dxf.start_angle)
                end_angle = math.radians(e.dxf.end_angle)
                sentido = "CCW" if e.dxf.end_angle > e.dxf.start_angle else "CW"
                
                puntos_interpolados = interpolar_arco(center, radius, start_angle, end_angle, sentido)
                for p in puntos_interpolados:
                    posiciones.append((p[0], p[1], z_altura))

        # ===  CONVERSIÓN A JBI ===
        with open(jbi_path, "w") as f:
            f.write("/JOB\n")
            f.write(f"//NAME {nombre_base.upper()}\n")
            f.write("//POS\n")
            f.write(f"///NPOS {len(posiciones)},0,0,0,0,0\n")
            f.write(f"///TOOL {ut}\n")
            f.write(f"///USER {uf}\n")
            f.write("///POSTYPE USER\n")
            f.write("///RECTAN \n")
            f.write("///RCONF 1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n")

            # Generar las coordenadas en el archivo
            for idx, (x, y, z) in enumerate(posiciones):
                px = int(x * PULSES_POR_MM)
                py = int(y * PULSES_POR_MM)
                pz = int(z * PULSES_POR_MM)
                f.write(f"C{idx:05d}={px},{py},{pz},0,0,0\n")

            # ===  Instrucciones de movimiento ===
            f.write("//INST\n")
            f.write(f"///DATE {datetime.now().strftime('%Y/%m/%d %H:%M')}\n")
            f.write("///ATTR SC,RW,RJ\n")
            f.write("////FRAME USER 1\n")
            f.write("///GROUP1 RB1\n")
            f.write("NOP\n")

            # Generar los movimientos en el orden especificado
            for idx in range(0, len(posiciones), 2):
                f.write(f"MOVJ C{idx:05d} VJ={velocidadj}\n")
                f.write(f"DOUT OT#({pc}) ON\n")
                f.write("TIMER T=1.000\n")
                if idx + 1 < len(posiciones):
                    f.write(f"MOVL C{idx + 1:05d} V={velocidad} PL=0\n")
                f.write(f"DOUT OT#({pc}) OFF\n")
                f.write("TIMER T=1.000\n")

            f.write("END\n")

        # === Subir el archivo JBI al servidor FTP ===
        gestor = GestorFTP()
        jbi_path = os.path.abspath(jbi_path)
        jbi_path = jbi_path.replace("\\", "/")
        print(jbi_path)
        try:
            gestor.subir_archivo(jbi_path)
        except Exception as e:
            print(f"Error al subir el archivo al servidor FTP: {e}")
        finally:
            gestor.cerrar_conexion()

        return jbi_path, gcode_path

    except Exception as e:
        print(f"Error en la conversión DXF a Yaskawa: {e}")
        raise e