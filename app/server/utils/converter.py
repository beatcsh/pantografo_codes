from shapely.geometry import Polygon, JOIN_STYLE
from shapely.ops import unary_union
from typing import List, Tuple                               # Importar el módulo csv para poder usar los archivos .csv para las tablas
from ezdxf.math import BSpline                                    
from datetime import datetime
import ezdxf                                                #Libreria para convertit de dxf a codigo G
import math
import os     
import re

uso = 0                                                     #0 Para corte láser, 1 para dremel
PULSES_POR_MM = 1                                           #Cuando se requiera obtener el valor en pulsos, se cambia esta variable 
offset = 10                                                #Valor compensación de la herramienta

#Configuración de usuario para entrar al servidor del robot
FTP_HOST = "192.168.1.31"                                   #IP del servidor                                
FTP_USER = "rcmaster"                                       #Nombre de usuario con todos los privilegios
FTP_PASS = "9999999999999999"                               #Contraseña del modo mantenimiento
    
def get_area(points):
    area = 0
    n = len(points)
    for i in range(n):
        x1, y1 = points[i]
        x2, y2 = points[(i + 1) % n]
        area += (x1 * y2) - (x2 * y1)
    return area / 2 

def get_centroid(points):
    polygon = Polygon(points)
    centroide = polygon.centroid
    return (centroide.x, centroide.y)


def linear_lead_in(points, kerf, uso, is_exterior, tolerance=4):
    if uso == 0:
        def is_closed(contour):
            x0, y0 = contour[0]
            x1, y1 = contour[-1]
            return abs(x0 - x1) < tolerance and abs(y0 - y1) < tolerance

        if not is_exterior and not is_closed(points):
            return [points[0], points[0]]                                   # Sin desplazamiento

        x0, y0 = points[0]

        if not is_exterior:                                                 # Lead-in desde el centroide hasta el primer punto (interior)
            centroid = get_centroid(points)
            return [centroid, (x0, y0)]
        else:                                                               # Lead-in perpendicular al primer segmento (exterior)
            x1, y1 = points[1]
            dx = x1 - x0
            dy = y1 - y0

            angle = math.atan2(dy, dx)
            angle_perp = angle + math.radians(90)

            lead_len = kerf + offset
            lead_dx = -lead_len * math.cos(angle_perp)
            lead_dy = -lead_len * math.sin(angle_perp)

            lead_start = (x0 + lead_dx, y0 + lead_dy)
    else:
        lead_start = points[0]
    return [lead_start] 


def connect_polylines(polylines: List[List[Tuple[float, float]]]) -> List[List[Tuple[float, float]]]:
    result = []
    unused = polylines[:]
    
    while unused:
        current = unused.pop(0)
        changed = True
        while changed:
            changed = False
            for i, other in enumerate(unused):
                if points_equal(current[-1], other[0]):
                    current += other[1:]
                    unused.pop(i)
                    changed = True
                    break
                elif points_equal(current[0], other[-1]):
                    current = other[:-1] + current
                    unused.pop(i)
                    changed = True
                    break
                elif points_equal(current[-1], other[-1]):
                    current += list(reversed(other[:-1]))
                    unused.pop(i)
                    changed = True
                    break
                elif points_equal(current[0], other[0]):
                    current = list(reversed(other[1:])) + current
                    unused.pop(i)
                    changed = True
                    break
        result.append(current)
    
    return result

def points_equal(p1, p2, eps=1e-6):
    return abs(p1[0] - p2[0]) < eps and abs(p1[1] - p2[1]) < eps

def extract_entities_as_segments(msp) -> List[List[Tuple[float, float]]]:
    segments = []

    for entity in msp:
        points = []

        if entity.dxftype() == 'LINE':
            start = (entity.dxf.start.x, entity.dxf.start.y)
            end = (entity.dxf.end.x, entity.dxf.end.y)
            points = [start, end]

        elif entity.dxftype() == 'ARC':
            center = (entity.dxf.center.x, entity.dxf.center.y)
            r = entity.dxf.radius
            start_a = math.radians(entity.dxf.start_angle)
            end_a = math.radians(entity.dxf.end_angle)
            if end_a < start_a:
                end_a += 2 * math.pi
            steps = 20
            points = [
                (center[0] + r * math.cos(start_a + j * (end_a - start_a) / steps),
                 center[1] + r * math.sin(start_a + j * (end_a - start_a) / steps))
                for j in range(steps + 1)
            ]

        elif entity.dxftype() == 'CIRCLE':
            center = (entity.dxf.center.x, entity.dxf.center.y)
            r = entity.dxf.radius
            steps = 40
            points = [
                (center[0] + r * math.cos(2 * math.pi * j / steps),
                 center[1] + r * math.sin(2 * math.pi * j / steps))
                for j in range(steps + 1)
            ]
            points.append(points[0])  # cerrar círculo

        elif entity.dxftype() == 'ELLIPSE':
            center = (entity.dxf.center.x, entity.dxf.center.y)
            major_axis = entity.dxf.major_axis
            ratio = entity.dxf.ratio
            start_param = entity.dxf.start_param
            end_param = entity.dxf.end_param
            steps = 40
            a = math.hypot(*major_axis[:2])
            angle = math.atan2(major_axis[1], major_axis[0])
            b = a * ratio
            points = [
                (
                    center[0] + a * math.cos(t) * math.cos(angle) - b * math.sin(t) * math.sin(angle),
                    center[1] + a * math.cos(t) * math.sin(angle) + b * math.sin(t) * math.cos(angle)
                )
                for t in [start_param + i * (end_param - start_param) / steps for i in range(steps + 1)]
            ]

        elif entity.dxftype() == 'SPLINE':
            spline = entity.construction_tool()
            points = [(p.x, p.y) for p in spline.approximate(segments=50)]

        elif entity.dxftype() == 'LWPOLYLINE':
            points = [(pt[0], pt[1]) for pt in entity.get_points()]
            if entity.closed:
                points.append(points[0])

        elif entity.dxftype() == 'POLYLINE':
            points = [(v.dxf.location.x, v.dxf.location.y) for v in entity.vertices]

        elif entity.dxftype() == 'HATCH':
            for path in entity.paths:
                if path.PATH_TYPE_EDGE:
                    poly = []
                    for edge in path.edges:
                        if edge.type == 'LineEdge':
                            poly.append((edge.start[0], edge.start[1]))
                            poly.append((edge.end[0], edge.end[1]))
                        elif edge.type == 'ArcEdge':
                            center = edge.center
                            r = edge.radius
                            start_a = math.radians(edge.start_angle)
                            end_a = math.radians(edge.end_angle)
                            if edge.is_counter_clockwise:
                                if end_a < start_a:
                                    end_a += 2 * math.pi
                            else:
                                if start_a < end_a:
                                    start_a += 2 * math.pi
                                start_a, end_a = end_a, start_a
                            steps = 20
                            arc_points = [
                                (
                                    center[0] + r * math.cos(start_a + j * (end_a - start_a) / steps),
                                    center[1] + r * math.sin(start_a + j * (end_a - start_a) / steps)
                                )
                                for j in range(steps + 1)
                            ]
                            poly.extend(arc_points)
                    if poly:
                        segments.append(poly)
                    continue
        if points:
            segments.append(points)

    return segments


def generate_gcode_from_dxf(filename, z_value, kerf, uso):                      #Empieza a crear el código G
    doc = ezdxf.readfile(filename)                          #Lee el archivo .dxf con ezdxf
    msp = doc.modelspace()                                  #Crea un modelo en el espacio para ser utilizado
    gcode = []       

    def code_impr():
        gcode.append(f"( {kind} corte )")
        gcode.append(f"G0 X{lead[0][0]:.3f} Y{lead[0][1]:.3f} Z{z_value +10:.3f}")
        gcode.append(f"G0 X{lead[0][0]:.3f} Y{lead[0][1]:.3f} Z{z_value:.3f}")
        gcode.append("M03 ; plasma ON")
        for pt in ord:
            gcode.append(f"G1 X{pt[0]:.3f} Y{pt[1]:.3f} Z{z_value:.3f}")
        gcode.append("M05 ; plasma OFF")
        gcode.append(f"G0 X{pt[0]:.3f} Y{pt[1]:.3f} Z{z_value +10:.3f}")

    gcode.append("G21 ; mm")                                #Declara que las unidades son milimetros
    gcode.append("G90 ; abs")                               #Las coordenadas serán absolutas
    gcode.append("M05 ; plasma off")                        #Inicia el programa con el cortador de plasma desenergizado

    acc_points = extract_entities_as_segments(msp)
    ord_points = connect_polylines(acc_points)

    areas = [(get_area(polygon), polygon) for polygon in ord_points]    # Calcular áreas de cada polígono
    areas.sort(key=lambda x: abs(x[0]), reverse=True)                   # Ordenar por área absoluta descendente
    clasificados = []                                                   # El de mayor área se marca como 'Exterior', los demás 'Interior'
    
    for idx, (area, polygon) in enumerate(areas):
        is_outer = idx == 0                                             # El más grande es exterior
        clasificados.append((polygon, is_outer))
    interiores = [item for item in clasificados if not item[1]]         # Separar interiores y exteriores
    exteriores = [item for item in clasificados if item[1]]
    orden_dibujo = interiores + exteriores                              # Unir: primero interiores, luego exteriores


    for ord, is_outer in orden_dibujo:
        kind = 'Exterior' if is_outer else 'Interior'
        
        # poly = Polygon(ord)                                                         # Convertir a polígono y aplicar desplazamiento por kerf
        # offset = kerf if is_outer else -kerf
        # buffered = poly.buffer(offset, join_style=JOIN_STYLE.mitre)

        # if not buffered.is_empty and buffered.geom_type == 'Polygon':               # Asegurarse que el buffer resultante sea un polígono válido
        #     ord = list(buffered.exterior.coords)                                    # Extraer nueva lista de puntos
        # else:
        #     continue                                                                # Si hay error en el buffer, saltar figura

        lead = linear_lead_in(ord, kerf, uso, is_exterior=is_outer)
        code_impr()


    gcode.append("M30 ; fin")                                                   #Cuando ya no hallan más instrucciones, finaliza el programa
    return (gcode)

predet = 25                                                                     #Valores predeterminados de velocidad VJ
velocidades = predet

def gcode_a_yaskawa(gcode_lines, z_altura, velocidad, nombre_base, output_dir, uf, ut, pc, velocidadj):     #Traducción del codigo G a inform 2
    nombre, extension = os.path.splitext(nombre_base)                   # Separar nombre y extensión
    nombre_limpio = re.sub(r'[^a-zA-Z0-9]', '', nombre)                 # Limpiar: quitar todo lo que no sea letras o números
    nombre_limpio = nombre_limpio[:9]                                   # Recortar a máximo 6 caracteres
    nuevo_nombre = f"{nombre_limpio}{extension}"                        # Crear nuevo nombre completo                                        

    jbi_path = os.path.join(output_dir, f"{nuevo_nombre}.JBI")                #Dirección y tipo de archivo del programa inform 2 (del robot)
    g_path = os.path.join(output_dir, f"{nuevo_nombre}.gcode")                #Dirección y tipo de archivo del código G

    try:
        with open(g_path, "w") as gf:                                           #Abre el archivo del código G para empezar a traducirlo
            gf.write("\n".join(gcode_lines))

        with open(jbi_path, "w") as f:                                                  #Abre el archivo del inform 2 para empezar a escribir
            f.write("/JOB\n")                                                           #Indica tipo de archivo
            f.write(f"//NAME {nuevo_nombre.upper()}\n")                               #Nombre del JOB
            f.write("//POS\n")                                                          #Indica posiciones
            total_pos = sum(1 for line in gcode_lines if line.startswith("G"))          #Determina el número total de posiciones
            f.write(f"///NPOS {total_pos},0,0,0,0,0\n")                                 #Número total de posiciones
            f.write(f"///TOOL {ut}\n")                                                  #Número de herramienta
            f.write(f"///USER {uf}\n")                                                  #Número de usuario
            f.write("///POSTYPE USER\n")                                                #Indica el tipo de movimiento (Usuario en este caso)
            f.write("///RECTAN \n")                                                     #Indica las unidades (milimetros en este caso)
            f.write("///RCONF 1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n")       #Configuraciones del robot (Por investigar a fondo)
            idx = 0                                                     
            posiciones = []                                         
            for i, line in enumerate(gcode_lines):                                      #Genera las coordenadas y su número correspondiente
                if line.startswith("G0") or line.startswith("G1"):                      #Identifica si es G0 o G1
                    parts = line.split()
                    coords = {p[0]: float(p[1:]) for p in parts[1:] if p[0] in "XYZ"}
                    x = round(coords.get("X", 0.0), 4)                                  #Redondea los valores a cuatro decimales
                    y = round(coords.get("Y", 0.0), 4)
                    z = round(coords.get("Z", 0.0), 4)
                    posiciones.append((x, y, z))
                    f.write(f"C{idx:05d}={x},{y},{z},0,0,0\n")                          #Escribe los valores acomodados
                    idx += 1
            f.write("///POSTYPE PULSE\n")
            f.write("///PULSE\n")
            f.write(f"C{idx:05d}=0,0,0,0,0,0\n") 
            f.write(f"C{idx +1:05d}=0,0,0,0,0,0\n")  

            f.write("//INST\n")                                                         #Instrucciones
            f.write(f"///DATE {datetime.now().strftime('%Y/%m/%d %H:%M')}\n")           #Fecha
            f.write("///ATTR SC,RW,RJ\n")                                               #Shared constant, read/write y Relative Job
            f.write("////FRAME USER 1\n")                                               #User frame 1
            f.write("///GROUP1 RB1\n")                                                  #Grupo de coordenadas
            f.write("NOP\n")
            f.write(f"DOUT OT#({pc}) OFF\n")                                            #Al final del programa, apaga la antorcha
            f.write(f"MOVJ C{idx +1:05d} VJ=10.0\n")
            #Escribe los movimientos, junto con el prendido y apagado de la antorcha y timers
            if velocidades == predet:                                                   
                j = 0
                i = 0
                while i < len(gcode_lines):                                                 
                    line = gcode_lines[i]
                    if line.startswith("G0"):                                           #Si lee un G0, escribe un MOVJ con VJ
                        f.write(f"MOVJ C{j:05d} VJ={velocidadj}\n")
                        j += 1
                    elif line.startswith("G1"):                                         #Si lee un G1, escribe un MOVL con V
                        f.write(f"MOVL C{j:05d} V={velocidad} PL=0\n")
                        j += 1
                    elif line.startswith("M03"):                                        #Si lee un M03, escribe el encendido de la antorcha y 
                        f.write(f"DOUT OT#({pc}) ON\n")                                 #Agrega un pequeño timer de 1 segundo
                        f.write(f"TIMER T=2.00\n")
                    elif line.startswith("M05"):                                        #Si lee un M05, apaga la antorcha con un timer
                        f.write(f"DOUT OT#({pc}) OFF\n")
                        f.write(f"TIMER T=2.00\n")
                    else:
                        pass  # No se incrementa j                                      #Si no lee nada, pasa a la siguiente línea
                    i += 1  # Siempre pasa a la siguiente línea

                    
            f.write(f"DOUT OT#({pc}) OFF\n")                                            #Al final del programa, apaga la antorcha
            f.write(f"MOVJ C{j:05d} VJ=10.0\n")
            f.write("END\n")                                                            #Fin del programa

        return jbi_path, g_path 
    except Exception as e:
        raise e
