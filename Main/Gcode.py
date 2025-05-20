import ezdxf                                                #Libreria para convertit de dxf a codigo G
import math
from shapely.geometry import Polygon, Point, LineString
from shapely.ops import unary_union   

def generate_gcode_from_dxf(filename, kerf):                      #Empieza a cear el código G
    doc = ezdxf.readfile(filename)                          #Lee el archivo .dxf con ezdxf
    msp = doc.modelspace()                                  #Crea un modelo en el espacio para ser utilizado
    gcode = []                                              

    gcode.append("G21 ; mm")                                #Declara que las unidades son milimetros
    gcode.append("G90 ; abs")                               #Las coordenadas serán absolutas
    gcode.append("M05 ; plasma off")                        #Inicia el programa con el cortador de plasma desenergizado

    for entity in msp:                                                  #Identifica si la instrucción es una linea, un circulo, una polilinea
        points = []                                                     #un arco, o un spline

        if entity.dxftype() == 'LINE':                                  #Si es una linea, regresa el valor inicial y el final
            start = (entity.dxf.start.x, entity.dxf.start.y)
            end = (entity.dxf.end.x, entity.dxf.end.y)
            points = [start, end]

        elif entity.dxftype() in ['LWPOLYLINE', 'POLYLINE']:            #Para cuando es una polilinea
            points = [tuple(p[:2]) for p in entity.get_points()]

        elif entity.dxftype() == 'ARC':                                 #Calcula y crea varios puntos para generar el arco
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

        elif entity.dxftype() == 'CIRCLE':                              #Crea todos los puntos para generar el círculo completo
            center = (entity.dxf.center.x, entity.dxf.center.y)
            r = entity.dxf.radius
            steps = 40
            points = [
                (center[0] + r * math.cos(2 * math.pi * i / steps),
                 center[1] + r * math.sin(2 * math.pi * i / steps))
                for i in range(steps)
            ]

        elif entity.dxftype() == 'SPLINE':                              #Calcula los puntos con la función de approximate_spline
            points = approximate_spline(entity)

        if points:                                                      #Empieza a escribir las instrucciones dependiendo del tipo
            line = 0
            # Determinar si es interior o exterior
            is_outer = not is_clockwise(points)
            kind = 'Exterior' if is_outer else 'Interior'                  

            if entity.dxftype() == 'LINE':                                      #Si es una linea, el valor del lead serán los puntos creados por la función
                lead = linear_lead_in(points, kerf, clockwise=is_outer)         #linear_lead_in
                line = 1 

            else:
                lead = circular_lead_in(points[0], kerf, clockwise=is_outer)          #Si es un círculo, el valor del lead serán los puntos creados por la función
                for pt in lead[1:]:                                             #circular_lead_in
                    gcode.append(f"G1 X{pt[0]:.3f} Y{pt[1]:.3f}")# F600")

            # Lead in
            gcode.append(f"( {kind} corte - {entity.dxftype()} )")              #Escribe que tipo de corte se realizará
            if line == 1:
                gcode.append(f"G0 X{lead[0][0]:.3f} Y{lead[0][1]:.3f}")         #Usa G00 para posicionamiento rápido en el inicio de la instrucción
            else:
                gcode.append(f"G0 X{lead[-1][0]:.3f} Y{lead[-1][1]:.3f}")
            gcode.append("M03 ; plasma ON")                                     #Energiza el cortador de plasma

            # Contorno principal
            for pt in points:                                                   #Empieza a escribir todos los movimientos con G01, con corte
                gcode.append(f"G1 X{pt[0]:.3f} Y{pt[1]:.3f}") #F600")

            # Cierra figura si es polígono
            # if len(points) > 2 and points[0] != points[-1]:
            #     gcode.append(f"G1 X{points[0][0]:.3f} Y{points[0][1]:.3f}")

            # Apagar compensación
            # gcode.append("G40 ; cancelar compensación")
            gcode.append("M05 ; plasma OFF")                                    #Al terminar, desenergiza el cortador
            # gcode.append("G0 Z5")

    gcode.append("M30 ; fin")                                                   #Cuando ya no hallan más instrucciones, finaliza el programa
    return (gcode)

def is_clockwise(points):                                   #Función que decide si es un corte exterior o interior dependiendo de la orientacioón
    area = 0
    for i in range(len(points)):
        x1, y1 = points[i]
        x2, y2 = points[(i + 1) % len(points)]
        area += (x2 - x1) * (y2 + y1)
    return area > 0

def circular_lead_in(start_point, kerf=1.5, clockwise=True):                                    #Crea el lead-in para los cortes circulares
    """Devuelve un arco de entrada circular como lista de puntos"""                             #Haciendo un arco
    cx, cy = start_point[0] - kerf, start_point[1] if clockwise else start_point[1] + kerf      #Aún por verificar su funcionamiento
    segments = 10
    angle_step = (math.pi / 2) / segments
    points = []
    for i in range(segments + 1):
        angle = angle_step * i
        x = cx + kerf * math.cos(angle)
        y = cy + kerf * math.sin(angle) if clockwise else cy - kerf * math.sin(angle)
        points.append((x, y))
    return points

def linear_lead_in(points, kerf=1.5, clockwise = True):                         #Crea el lead-in para los cortes lineales
    x, y = points[0][0], points[0][1]                                           #Haciendo una linea del tamaño del kerf, yendo de afuera a adentro   
    cy, cx = (points[1][1]-points[0][1]), (points[1][0]-points[0][0])

    if (cx == 0) or (cy == 0):                              #Detecta la dirección a la que corta
        if cx == 0 and cy > 0:
            kerf_ang = math.radians(90)
        elif cx == 0 and cy < 0:
            kerf_ang = math.radians(270)
        elif cx > 0 and cy == 0:
            kerf_ang = math.radians(0)
        elif cx < 0 and cy == 0:
            kerf_ang = math.radians(180)
    elif (cx < 0) and (cy < 0):                             #Detecta cuando corta en menos x y menos y (Para obtener el ángulo correctamente)
        kerf_ang = math.atan(cy/cx) + math.radians(180)         
    else:
        kerf_ang = math.atan(cy/cx)                         #Calcula la inclinación de la linea para que el lead + el corte hagan una línea recta
    
    kerf_x = kerf * math.cos(kerf_ang)                      
    kerf_y = kerf * math.sin(kerf_ang)
    
    if clockwise == False:                                  #Regresa el valor de x y y cuando es corte interno
        lead_start = (x+kerf_x, y+kerf_y)
    elif clockwise == True:
        lead_start = (x-kerf_x, y-kerf_y)                   #Regresa el valor de x y y cuando es corte externo
    return [lead_start, (x, y)]


def approximate_spline(entity, segments=20):                #* No sabe que hace *
    return [entity.points(i / segments)[:2] for i in range(segments + 1)]

