const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "BizReel Desktop",
    icon: path.join(__dirname, 'assets/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    backgroundColor: '#050508',
  });

  // In production, we load the exported web build
  const indexPath = path.join(__dirname, 'dist/index.html');

  // If running in dev mode, you could load the local metro server
  // win.loadURL('http://localhost:8081');

  win.loadFile(indexPath).catch(() => {
    console.log("Dist folder not found. Please run 'npm run build:windows' first.");
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
