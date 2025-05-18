const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const { spawn, execSync } = require('child_process');
const fs = require('fs').promises;
const axios = require('axios');
const os = require('os')
const crypto = require('crypto');

require('@electron/remote/main').initialize()

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
  win.webContents.openDevTools();
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
      output += data
    });

    syftProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    syftProcess.on('close', async (code) => {
      if (code === 0) {
        try {
          // Read the generated SBOM file
          const fileContent = await fs.readFile(outputPath);

          const hostname = os.hostname();
          const timestamp = new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
          }).replace(/[/:]/g, '-')
            .replace(',', '')
            .replace(/\s+/g, '_')
            .replace(/[AP]M/g, x => x.toLowerCase());
          
          // Get serial number based on platform
          let serialNumber;
          try {
            if (process.platform === 'win32') {
              serialNumber = execSync('powershell.exe  (Get-WmiObject -Class Win32_BIOS).SerialNumber').toString().trim();
            } else if (process.platform === 'darwin') {
              serialNumber = execSync('system_profiler SPHardwareDataType | grep "Serial Number (system)" | awk \'{print $4}\'').toString().trim();
            } else {
              // Linux
              serialNumber = execSync('sudo dmidecode -s system-serial-number').toString().trim();
            }
          } catch (error) {
            console.error('Error getting serial number:', error);
            serialNumber = 'unknown';
          }

          let macAddress;
          const networkInterfaces = os.networkInterfaces();
        for (const interfaceName in networkInterfaces) {
            const interface = networkInterfaces[interfaceName];
            for (const info of interface) {
                if (!info.internal && info.mac !== '00:00:00:00:00:00') {
                    macAddress = info.mac.replace(/:/g, '');
                    break;
                }
            }
            if (macAddress) break;
        }

        // If no MAC address found, generate a unique identifier
        if (!macAddress) {
            macAddress = crypto.randomBytes(6).toString('hex');
        }

          let filename = `${hostname}_${serialNumber}_${macAddress}_${timestamp}.json`;

          const formData = new FormData();
          const blob = new Blob([fileContent]);
          formData.append('file', blob, filename);
          const response = await axios.post(`http://report.vmittech.in:8080/upload`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          resolve({ success: true, message: 'SBOM created and uploaded successfully' });
        } catch (error) {
          reject({ success: false, error: `File upload failed: ${error.message}` });
        }
      } else {
        reject({ success: false, error: errorOutput });
      }
    });

    syftProcess.on('error', (error) => {
      reject({ success: false, error: error.message });
    });
  });
}); 