import os
import ezdxf
from datetime import datetime
from utils.ftp_manager import GestorFTP
import math
import math
from shapely.geometry import Polygon, Point, LineString
from shapely.ops import unary_union

PULSES_POR_MM = 1
kerf = 1.5

def is_clockwise(points):
    area = 0
    for i in range(len(points)):
        x1, y1 = points[i]
        x2, y2 = points[(i + 1) % len(points)]
        area += (x2 - x1) * (y2 + y1)
    return area > 0

def circular_lead_in(start_point, kerf=1.5, clockwise=True):
    """Devuelve un arco de entrada circular como lista de puntos"""
    cx, cy = start_point[0] - kerf, start_point[1] if clockwise else start_point[1] + kerf
    segments = 10
    angle_step = (math.pi / 2) / segments
    points = []
    for i in range(segments + 1):
        angle = angle_step * i
        x = cx + kerf * math.cos(angle)
        y = cy + kerf * math.sin(angle) if clockwise else cy - kerf * math.sin(angle)
        points.append((x, y))
    return points

def linear_lead_in(points, kerf=1.5, clockwise = True):
    x, y = points[0][0], points[0][1]
    cy, cx = (points[1][1]-points[0][1]), (points[1][0]-points[0][0])

    if (cx == 0) or (cy == 0):
        if cx == 0 and cy > 0:
            kerf_ang = math.radians(90)
        elif cx == 0 and cy < 0:
            kerf_ang = math.radians(270)
        elif cx > 0 and cy == 0:
            kerf_ang = math.radians(0)
        elif cx < 0 and cy == 0:
            kerf_ang = math.radians(180)
        else:
            kerf_ang = math.atan(cy/cx)
    
    kerf_x = kerf * math.cos(kerf_ang)
    kerf_y = kerf * math.sin(kerf_ang)

    if clockwise == False:
        lead_start = (-kerf_x, -kerf_y)
    elif clockwise == True:
        lead_start = (-kerf_x, -kerf_y)

    return [lead_start, (x, y)]

def approximate_spline(entity, segments=20):
    return [entity.point(i / segments)[:2] for i in range(segments + 1)]

def generate_gcode_from_dxf(filename):
    doc = ezdxf.readfile(filename)
    msp = doc.modelspace()
    gcode = []

    gcode.append("G21 ; mm")
    gcode.append("G90 ; abs")
    gcode.append("M05 ; plasma off")

    for entity in msp:
        points = []

        if entity.dxftype() == 'LINE':
            start = (entity.dxf.start.x, entity.dxf.start.y)
            end = (entity.dxf.end.x, entity.dxf.end.y)
            points = [start, end]

        elif entity.dxftype() in ['LWPOLYLINE', 'POLYLINE']:
            points = [tuple(p[:2]) for p in entity.get_points()]

        elif entity.dxftype() == 'ARC':
            center = (entity.dxf.center.x, entity.dxf.center.y)
            r = entity.dxf.radius
            start_a = math.radians(entity.dxf.start_angle)
            end_a = math.radians(entity.dxf.end_angle)
            if end_a < start_a:
                end_a += 2 * math.pi
            steps = 20
            points = [
                (center[0] + r * math.cos(start_a + i * (end_a - start_a) / steps),
                 center[1] + r * math.sin(start_a + i * (end_a - start_a) / steps))
                for i in range(steps + 1)
            ]

        elif entity.dxftype() == 'CIRCLE':
            center = (entity.dxf.center.x, entity.dxf.center.y)
            r = entity.dxf.radius
            steps = 40
            points = [
                (center[0] + r * math.cos(2 * math.pi * i / steps),
                 center[1] + r * math.sin(2 * math.pi * i / steps))
                for i in range(steps)
            ]

        elif entity.dxftype() == 'SPLINE':
            points = approximate_spline(entity)

        if points:
            line = 0
            # Determinar si es interior o exterior
            is_outer = not is_clockwise(points)
            kind = 'Exterior' if is_outer else 'Interior'

            if entity.dxftype() == 'LINE':
                lead = linear_lead_in(points, kerf=1.5, clockwise=is_outer)
                line = 1 

            else:
                lead = circular_lead_in(points[0], clockwise=is_outer)
                for pt in lead[1:]:
                    gcode.append(f"G1 X{pt[0]:.3f} Y{pt[1]:.3f}")# F600")

            # Lead in
            gcode.append(f"( {kind} corte - {entity.dxftype()} )")
            gcode.append("M03 ; plasma ON")
            if line == 1:
                gcode.append(f"G0 X{lead[0][0]:.3f} Y{lead[0][1]:.3f}")
            else:
                gcode.append(f"G0 X{lead[-1][0]:.3f} Y{lead[-1][1]:.3f}")

            # Contorno principal
            for pt in points:
                gcode.append(f"G1 X{pt[0]:.3f} Y{pt[1]:.3f}") #F600")

            # Cierra figura si es polígono
            if len(points) > 2 and points[0] != points[-1]:
                gcode.append(f"G1 X{points[0][0]:.3f} Y{points[0][1]:.3f}")

            # Apagar compensación
            # gcode.append("G40 ; cancelar compensación")
            gcode.append("M05 ; plasma OFF")
            # gcode.append("G0 Z5")

    gcode.append("M30 ; fin")
    return (gcode)

predet = 25
velocidades = predet

predet = 25
velocidades = predet

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
                    x = round(coords.get("X", 0.0), 4)
                    y = round(coords.get("Y", 0.0), 4)
                    z = round(z_altura, 4)
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
            if velocidades == predet:
                for j, line in enumerate(gcode_lines):
                    if (line.startswith("G0")):
                        f.write(f"MOVJ C{j:05d} VJ={velocidadj}\n")
                    elif (line.startswith("G1")):
                        f.write(f"MOVL C{j:05d} V={velocidad} PL=0\n")
                    elif (line.startswith("M03")):
                        f.write(f"DOUT OT#({pc}) ON\n")
                        f.write(f"TIMER T=1.000\n")
                    elif (line.startswith("M05")):
                        f.write(f"DOUT OT#({pc}) OFF\n")
                        f.write(f"TIMER T=1.000\n")           
            f.write(f"DOUT OT#({pc}) OFF\n")
            f.write("END\n")

        # subir el JOB por el servidor FTP
        gestor = GestorFTP()
        jbi_path = os.path.abspath(jbi_path)
        jbi_path = jbi_path.replace("\\", "/")
        print(jbi_path)
        try:
            gestor.subir_archivo(jbi_path)
        except Exception as e:
            print(f"no se pudo enviar el archivo por FTP: {e}")
        finally:
            gestor.cerrar_conexion()

        return jbi_path, g_path
    except Exception as e:
        raise e