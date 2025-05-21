G21 ; mm
G90 ; abs
M05 ; plasma off
( Exterior corte - LINE )
M03 ; plasma ON
G0 X-1.500 Y-0.000
G1 X0.000 Y0.000
G1 X150.000 Y0.000
M05 ; plasma OFF
( Exterior corte - LINE )
M03 ; plasma ON
G0 X-0.000 Y-1.500
G1 X0.000 Y0.000
G1 X0.000 Y350.000
M05 ; plasma OFF
( Exterior corte - LINE )
M03 ; plasma ON
G0 X-1.500 Y-0.000
G1 X0.000 Y350.000
G1 X150.000 Y350.000
M05 ; plasma OFF
( Exterior corte - LINE )
M03 ; plasma ON
G0 X-0.000 Y-1.500
G1 X150.000 Y0.000
G1 X150.000 Y350.000
M05 ; plasma OFF
M30 ; fin