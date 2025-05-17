const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  // Remove default menu
  Menu.setApplicationMenu(null);

  win.loadFile('index.html');
  // Uncomment for dev tools
  // win.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle directory selection
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  return result.filePaths[0];
});

// Handle save file dialog
ipcMain.handle('show-save-dialog', async (event, format) => {
  const result = await dialog.showSaveDialog({
    filters: [
      { name: format.toUpperCase(), extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    defaultPath: path.join(app.getPath('downloads'), `sbom.json`)
  });
  return result.filePath;
});

// Handle Syft execution
ipcMain.handle('run-syft', async (event, dirPath, format, outputPath) => {
  return new Promise((resolve, reject) => {
    let syftCommand = 'syft';
    if (process.platform === 'win32') {
      syftCommand = 'syft.exe';
    }

    const syftProcess = spawn(syftCommand, ['scan', 'dir:' + dirPath, '-o', format, '--file', outputPath]);
    let errorOutput = '';
    let output = '';

    syftProcess.stdout.on('data', (data) => {
      output += "SBOM created successfully";
    });

    syftProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    syftProcess.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, output });
      } else {
        reject({ success: false, error: errorOutput });
      }
    });

    syftProcess.on('error', (error) => {
      reject({ success: false, error: error.message });
    });
  });
}); 