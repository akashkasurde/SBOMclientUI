const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const { spawn, execSync } = require('child_process');
const fs = require('fs').promises;
const axios = require('axios');
const os = require('os')
const crypto = require('crypto');
const { saveOrgCode, getOrgCode } = require('./utils');
const config = require('./config');

require('@electron/remote/main').initialize()

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
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

// Add IPC handler for saving org code
ipcMain.handle('save-org-code', async (event, orgCode) => {
    await saveOrgCode(orgCode);
    return { success: true };
});

// Add IPC handler for getting org code
ipcMain.handle('get-org-code', async () => {
    return await getOrgCode();
});

// Handle Syft execution
ipcMain.handle('run-syft', async (event, dirPath, format, outputPath) => {
  registerDeviceIfNeeded();
  return new Promise((resolve, reject) => {
    // Set syft path based on platform
    let syftCommand = '';
    
    if (process.platform === 'win32') {
      syftCommand = path.join('C:\\Windows', 'syft.exe');
    } else {
      // Linux and macOS
      syftCommand = path.join('/bin', 'syft');
    }

    const syftProcess = spawn(syftCommand, ['scan', 'dir:' + dirPath, '-o', format, '--file', outputPath]);
    let errorOutput = '';

    syftProcess.stdout.on('data', () => {
      // Optionally log or handle stdout
    });

    syftProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    syftProcess.on('close', async (code) => {
      if (code === 0) {
        try {
          const fileContent = await fs.readFile(outputPath);
          const orgCode = await getOrgCode();
          
          if (!orgCode) {
            reject({ success: false, error: 'Organization code not set. Please set it first.' });
            return;
          }

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
              serialNumber = execSync('sudo dmidecode -s system-serial-number').toString().trim();
            }
          } catch (error) {
            console.error('Error getting serial number:', error);
            serialNumber = 'unknown';
          }

          let macAddress;
          const networkInterfaces = os.networkInterfaces();
          for (const interfaceName in networkInterfaces) {
            const iface = networkInterfaces[interfaceName];
            for (const info of iface) {
              if (!info.internal && info.mac !== '00:00:00:00:00:00') {
                macAddress = info.mac.replace(/:/g, '');
                break;
              }
            }
            if (macAddress) break;
          }

          if (!macAddress) {
            macAddress = crypto.randomBytes(6).toString('hex');
          }

          let filename = `${hostname}_${serialNumber}_${macAddress}_${timestamp}.json`;

          const formData = new FormData();
          const blob = new Blob([fileContent]);
          formData.append('sbom_report_file', blob, filename);
          formData.append('serial_name', serialNumber);
          formData.append('org_code', orgCode);

          await axios.post(`${config.apiBaseUrl}/saveSbom_report`, formData, {
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

// Device registration functions
async function isDeviceRegistered() {
  try {
    const markerPath = getMarkerPath();
    await fs.access(markerPath);
    return true;
  } catch {
    return false;
  }
}

function getMarkerPath() {
  const rootDir = process.platform === 'win32' ? 'C:\\Users\\Public\\Documents' : '/var/tmp';
  return path.join(rootDir, '.device_registered');
}

async function createRegistrationMarker() {
  const markerPath = getMarkerPath();
  await fs.writeFile(markerPath, 'Device registered');

  // Make the file hidden based on platform
  try {
    if (process.platform === 'win32') {
      // Windows: Use attrib command
      execSync(`attrib +h "${markerPath}"`);
    } else {
      // Unix-like systems (macOS/Linux): Use chmod to set file permissions
      await fs.chmod(markerPath, 0o600); // Read/write for owner only
    }
  } catch (error) {
    console.error('Error setting marker file attributes:', error);
  }
}

async function registerDeviceIfNeeded() {


  try {
    if (await isDeviceRegistered()) {
      console.log('Device already registered');
      return;
    }

    const hostname = os.hostname();
    let serialNumber;
    try {
      if (process.platform === 'win32') {
        serialNumber = execSync('powershell.exe  (Get-WmiObject -Class Win32_BIOS).SerialNumber').toString().trim();
      } else if (process.platform === 'darwin') {
        serialNumber = execSync('system_profiler SPHardwareDataType | grep "Serial Number (system)" | awk \'{print $4}\'').toString().trim();
      } else {
        serialNumber = execSync('sudo dmidecode -s system-serial-number').toString().trim();
      }
    } catch (error) {
      console.error('Error getting serial number:', error);
      serialNumber = 'unknown';
    }

    let macAddress;
    const networkInterfaces = os.networkInterfaces();
    for (const interfaceName in networkInterfaces) {
      const iface = networkInterfaces[interfaceName];
      for (const info of iface) {
        if (!info.internal && info.mac !== '00:00:00:00:00:00') {
          macAddress = info.mac.replace(/:/g, '');
          break;
        }
      }
      if (macAddress) break;
    }

    if (!macAddress) {
      macAddress = crypto.randomBytes(6).toString('hex');
    }

    let data = new FormData();
    data.append('macAddress', macAddress);
    data.append('org_code', config.defaultOrgCode);
    data.append('serial_name', serialNumber);
    data.append('device_name', hostname);

    let requestConfig = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `${config.apiBaseUrl}/deviceRegister`,
      data: data
    };

    let response = await axios.request(requestConfig)
    console.log(response)
    if (response.status === 200) {
      await createRegistrationMarker();
      console.log('Device registered successfully');
    }
    console.log(JSON.stringify(response.data));

  } catch (error) {
    console.error('Device registration failed1:', error.message);
  }
}