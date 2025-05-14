import os
import ezdxf
from datetime import datetime
from utils.ftp_manager import GestorFTP

PULSES_POR_MM = 1

def convertir_dxf_a_yaskawa(dxf_path, z_altura, velocidad, nombre_base, output_dir, uf, ut, pc, velocidadj):
    jbi_path = os.path.join(output_dir, f"{nombre_base}.JBI")
    gcode_path = os.path.join(output_dir, f"{nombre_base}.gcode")

    try:
        # Leer archivo DXF
        doc = ezdxf.readfile(dxf_path)
        msp = doc.modelspace()
        gcode_lines = []
        
        # Generar el código G desde el archivo DXF
        for e in msp:
            if e.dxftype() == 'LINE':
                start = e.dxf.start
                end = e.dxf.end
                gcode_lines.append(f"G0 X{start[0]:.3f} Y{start[1]:.3f}")
                gcode_lines.append(f"G1 X{end[0]:.3f} Y{end[1]:.3f}")

        # Guardar el archivo GCODE
        with open(gcode_path, "w") as gf:
            gf.write("\n".join(gcode_lines))

        # === [2️⃣ CONVERSIÓN DE GCODE A JBI] ===
        with open(jbi_path, "w") as f:
            f.write("/JOB\n")
            f.write(f"//NAME {nombre_base.upper()}\n")
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

        # Subir el archivo JBI al servidor FTP
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