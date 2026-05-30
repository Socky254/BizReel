const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

function createWindow() {
  // Remove default menu for a cleaner look
  Menu.setApplicationMenu(null);

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1000,
    minHeight: 700,
    title: "BizReel",
    icon: path.join(__dirname, 'assets/icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      devTools: true, // Keep enabled for now to help the user if needed
    },
    backgroundColor: '#050508', // Match app background
    show: false, // Don't show until ready-to-show
  });

  const indexPath = path.join(__dirname, 'dist/index.html');

  win.loadFile(indexPath).catch(() => {
    console.log("Dist folder not found. Please run 'npm run build:windows' first.");
  });

  win.once('ready-to-show', () => {
    win.show();
  });

  // Open DevTools automatically if we are debugging
  // win.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
