const { app, BrowserWindow } = require('electron');

app.disableHardwareAcceleration(); // ✅ Fix GPU issue (must be BEFORE app.whenReady())

let win;
app.whenReady().then(() => {
    win = new BrowserWindow({
        width: 1200,
        height: 600,
        webPreferences: {
            nodeIntegration: false
        }
    });
    win.loadURL("http://127.0.0.1:3000"); // Load Flask app
});
