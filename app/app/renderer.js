document.getElementById('gcodeForm').addEventListener('submit', async (event) => {
    event.preventDefault();
  
    const gcodeLines = document.getElementById('gcodeInput').value.split('\n');
    
    // Datos que se envían al API
    const payload = {
      gcode_lines: gcodeLines,
      z_altura: 7.0,
      velocidad: 15.0,
      nombre_base: "ejemplo",
      uf: 1,
      ut: 1,
      pc: 0,
      velocidadj: 85.0
    };
  
    const response = await window.api.convertGCode(payload);
    document.getElementById('responseOutput').innerText = JSON.stringify(response, null, 2);
  });  