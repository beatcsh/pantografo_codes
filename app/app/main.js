const { app, BrowserWindow } = require('electron')

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600
    })

    win.loadFile('index.html')
}

app.whenReady().then(createWindow)

ipcMain.handle('convert-gcode', async (event, data) => {
    try {
        const response = await axios.post('http://127.0.0.1:8000/convert', data);
        return response.data;
    } catch (error) {
        console.error('Error al consumir API:', error.message);
        return { error: error.message };
    }
});

app.whenReady().then(createWindow);