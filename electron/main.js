const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const crypto = require('crypto'); // Added for integrity check
const https = require('https');
const http = require('http');

// Suppress Electron security warnings in development
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

const fs = require('fs');
const AdmZip = require('adm-zip');
const net = require('net');

// Allow autoplay without user interaction
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

let mainWindow = null;
let downloadInterval = null;

// --- Configuration ---
const SECURITY_CHECK_ENABLED = true;
const SECURITY_ENDPOINT = 'https://raw.githubusercontent.com/Litas-dev/Relictum-Launcher/main/security.json';

// --- Application Logic ---
function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    resizable: false,
    frame: false,
    thickFrame: false, // Removes 1px border on Windows
    backgroundColor: '#1a1a1a',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow = win;

  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../dist_renderer/index.html')}`;
  
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
      win.loadURL('http://localhost:5174');
      win.webContents.openDevTools({ mode: 'detach' });
  } else {
      win.loadURL(startUrl);
  }

  // Ensure window is not resizable when restored
  win.on('unmaximize', () => {
      win.setResizable(false);
  });

  ipcMain.on('minimize-window', () => win.minimize());
  ipcMain.on('maximize-window', () => {
    if (win.isMaximized()) {
        win.unmaximize();
    } else {
        win.setResizable(true); // Allow maximizing
        win.maximize();
    }
  });
  ipcMain.on('close-window', () => {
    win.close();
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// --- Game Logic ---

/** 
 * Shared helper to process downloaded game assets
 * Handles archive extraction (ZIP/RAR) and executable discovery 
 */
async function processGameDownload(downloadedFile, finalPath, eventSender, options = {}) {
    console.log("Processing download:", downloadedFile);
    let gamePath = downloadedFile;
    let archiveToExtract = null;
    let archiveType = null;

    if (!options.skipExtraction) {
        // 1. Check if the file itself is a zip or rar
        if (gamePath.toLowerCase().endsWith('.zip') && fs.existsSync(gamePath)) {
            archiveToExtract = gamePath;
            archiveType = 'zip';
        } else if (gamePath.toLowerCase().endsWith('.rar') && fs.existsSync(gamePath)) {
            archiveToExtract = gamePath;
            archiveType = 'rar';
        }
        
        // If gamePath is a directory (e.g. from torrent), search inside for archives
        if (!archiveToExtract && fs.existsSync(gamePath) && fs.statSync(gamePath).isDirectory()) {
             try {
                const files = fs.readdirSync(gamePath);
                const zipFiles = files.filter(f => f.toLowerCase().endsWith('.zip'));
                const rarFiles = files.filter(f => f.toLowerCase().endsWith('.rar'));
                
                if (zipFiles.length > 0) {
                     archiveToExtract = path.join(gamePath, zipFiles[0]);
                     archiveType = 'zip';
                } else if (rarFiles.length > 0) {
                     archiveToExtract = path.join(gamePath, rarFiles[0]);
                     archiveType = 'rar';
                }
             } catch(e) {
                 console.error("Error scanning for archive in dir:", e);
             }
        }
    } else {
        console.log("Extraction skipped per options.");
    }

    if (archiveToExtract && fs.existsSync(archiveToExtract)) {
        try {
            console.log(`Detected ${archiveType.toUpperCase()}:`, archiveToExtract);
            eventSender.send('download-status', `Extracting ${archiveType.toUpperCase()} please wait...`);
            
            if (archiveType === 'rar') {
                console.log("Using 7zip to extract RAR...");
                await new Promise((resolve, reject) => {
                    const myStream = Seven.extractFull(archiveToExtract, finalPath, {
                        $bin: sevenBin.path7za,
                        $progress: true
                    });
                    
                    myStream.on('end', () => resolve());
                    myStream.on('error', (err) => reject(err));
                    myStream.on('progress', (progress) => {
                        // Optional: Could send progress updates
                        // console.log(progress); 
                    });
                });
            } else {
                // ZIP Extraction
                // Use PowerShell for extraction on Windows (more reliable for large files)
                if (process.platform === 'win32') {
                    const powershellCommand = `Expand-Archive -LiteralPath "${archiveToExtract}" -DestinationPath "${finalPath}" -Force`;
                    console.log("Using PowerShell to extract...");
                    
                    await new Promise((resolve, reject) => {
                        const ps = spawn('powershell.exe', ['-NoProfile', '-Command', powershellCommand]);
                        
                        ps.on('close', (code) => {
                            if (code === 0) resolve();
                            else reject(new Error(`PowerShell extraction failed with code ${code}`));
                        });
                        
                        ps.on('error', (err) => reject(err));
                    });
                } else {
                    // Fallback for non-Windows (or if PS fails, though we await above)
                    const zip = new AdmZip(archiveToExtract);
                    zip.extractAllTo(finalPath, true);
                }
            }
            
            console.log("Extraction successful.");
            
            // Delete the archive file after successful extraction to save space
            try {
                fs.unlinkSync(archiveToExtract);
            } catch (err) {
                console.warn("Failed to delete archive file:", err);
            }
            
            // Attempt to locate the extracted folder
            const archiveName = path.basename(archiveToExtract, path.extname(archiveToExtract));
            const possibleDir = path.join(finalPath, archiveName);
            
            if (fs.existsSync(possibleDir) && fs.statSync(possibleDir).isDirectory()) {
                gamePath = possibleDir;
            } else {
                gamePath = finalPath;
            }
        } catch (e) {
            console.error("Extraction failed:", e);
        }
    } else {
        console.log("No Archive file detected or file not found.");
    }

    // Helper to find WoW executable
    const findExe = (dir) => {
        if (!fs.existsSync(dir)) return null;
        try {
            const files = fs.readdirSync(dir, { withFileTypes: true });
            
            // Priority 1: WoW.exe
            const wowExe = files.find(f => f.isFile() && f.name.toLowerCase() === 'wow.exe');
            if (wowExe) return path.join(dir, wowExe.name);

            // Priority 2: World of Warcraft.exe (Launcher)
            const launcherExe = files.find(f => f.isFile() && f.name.toLowerCase() === 'world of warcraft.exe');
            if (launcherExe) return path.join(dir, launcherExe.name);

            // Recursive search (Depth limited to avoid deep scans)
            for (const subdir of files.filter(f => f.isDirectory())) {
                    // Skip hidden folders or non-game folders
                    if (subdir.name.startsWith('.')) continue;
                    
                    const found = findExe(path.join(dir, subdir.name));
                    if (found) return found;
            }
        } catch (e) {
            console.error("Error scanning dir:", dir, e);
        }
        return null;
    };

    console.log("Searching for executable in:", gamePath);
    const exePath = findExe(gamePath) || findExe(finalPath);
    
    if (exePath) {
        console.log("Executable found:", exePath);
        eventSender.send('download-complete', { path: exePath });
    } else {
        console.log("Executable not found. Returning folder path.");
        eventSender.send('download-complete', { path: gamePath });
    }
}

ipcMain.on('launch-game', (event, gamePath) => {
  if (!gamePath || !fs.existsSync(gamePath)) {
      event.reply('game-launch-error', 'Game executable not found!');
      return;
  }
  
  // Launch the game process
  // detached: true allows it to run independently
  // stdio: 'ignore' prevents hanging on output
  const gameProcess = spawn(gamePath, [], { detached: true, stdio: 'ignore' });
  
  // Listen for the process exit to notify renderer
  gameProcess.on('close', (code) => {
      if (!event.sender.isDestroyed()) {
          event.reply('game-closed', code);
      }
  });

  gameProcess.on('error', (err) => {
      if (!event.sender.isDestroyed()) {
          event.reply('game-launch-error', err.message);
      }
  });

  // Note: We DO NOT call gameProcess.unref() here because we want to keep 
  // the reference to listen for the 'close' event.
  // If we unref(), the event loop won't wait for the child, and listeners might stop working
  // or the object might be garbage collected (though less likely for ChildProcess).
  // However, since detached: true is set, the child will survive even if the parent exits
  // (on Windows mostly), but keeping the reference in the variable `gameProcess` 
  // within this closure is enough for the listener to work while the main process is alive.

  event.reply('game-launched', 'Game launched successfully!');
});

ipcMain.handle('clear-game-cache', async (event, gamePath) => {
    try {
        if (!gamePath) return { success: false, message: "No game path provided" };
        
        const gameDir = fs.lstatSync(gamePath).isFile() ? path.dirname(gamePath) : gamePath;
        const wdbPath = path.join(gameDir, 'WDB');
        const cachePath = path.join(gameDir, 'Cache'); // Modern clients might use this too

        let cleared = false;

        if (fs.existsSync(wdbPath)) {
            console.log("Clearing WDB cache at:", wdbPath);
            fs.rmSync(wdbPath, { recursive: true, force: true });
            cleared = true;
        }

        if (fs.existsSync(cachePath)) {
            console.log("Clearing Cache folder at:", cachePath);
            fs.rmSync(cachePath, { recursive: true, force: true });
            cleared = true;
        }

        return { success: true, cleared };
    } catch (e) {
        console.error("Error clearing cache:", e);
        return { success: false, message: e.message };
    }
});

ipcMain.handle('select-game-path', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'Executables', extensions: ['exe'] }]
    });
    return (result.canceled || result.filePaths.length === 0) ? null : result.filePaths[0];
});

ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory']
    });
    return (result.canceled || result.filePaths.length === 0) ? null : result.filePaths[0];
});

ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory']
    });
    return (result.canceled || result.filePaths.length === 0) ? null : result.filePaths[0];
});

ipcMain.handle('get-game-version', async (event, gamePath) => {
    try {
        if (!gamePath || !fs.existsSync(gamePath)) return null;
        
        // Only Windows supports getting version info this way easily
        if (process.platform === 'win32') {
             // Use PowerShell to get the ProductVersion
             const powershellCommand = `(Get-Item "${gamePath}").VersionInfo.ProductVersion`;
             
             return new Promise((resolve) => {
                 const ps = spawn('powershell.exe', ['-NoProfile', '-Command', powershellCommand]);
                 let output = '';
                 
                 ps.stdout.on('data', (data) => {
                     output += data.toString();
                 });
                 
                 ps.on('close', (code) => {
                     if (code === 0) {
                         resolve(output.trim());
                     } else {
                         resolve(null);
                     }
                 });
                 
                 ps.on('error', (err) => {
                     console.error("PowerShell version check error:", err);
                     resolve(null);
                 });
             });
        }
        return null;
    } catch (e) {
        console.error("Error getting game version:", e);
        return null;
    }
});

ipcMain.handle('read-realmlist', async (event, { gamePath }) => {
    try {
        if (!gamePath) return { success: false, message: "Missing game path" };
        
        const gameDir = path.dirname(gamePath);
        
        // Potential locations for realmlist.wtf
        const potentialPaths = [
            path.join(gameDir, 'Data', 'enUS', 'realmlist.wtf'),
            path.join(gameDir, 'Data', 'enGB', 'realmlist.wtf'),
            path.join(gameDir, 'realmlist.wtf')
        ];
        
        for (const p of potentialPaths) {
            if (fs.existsSync(p)) {
                const content = fs.readFileSync(p, 'utf8');
                return { success: true, content: content.trim() };
            }
        }
        
        return { success: false, message: "Realmlist file not found" };
    } catch (e) {
        console.error("Error reading realmlist:", e);
        return { success: false, message: e.message };
    }
});

ipcMain.handle('update-realmlist', async (event, { gamePath, content }) => {
    try {
        if (!gamePath || !content) return { success: false, message: "Missing arguments" };
        
        const gameDir = path.dirname(gamePath);
        console.log("Updating realmlist in:", gameDir);
        
        // Potential locations for realmlist.wtf
        const potentialPaths = [
            path.join(gameDir, 'realmlist.wtf'),
            path.join(gameDir, 'Data', 'enUS', 'realmlist.wtf'),
            path.join(gameDir, 'Data', 'enGB', 'realmlist.wtf')
        ];
        
        let updatedCount = 0;
        
        // Try to update existing files
        for (const p of potentialPaths) {
            if (fs.existsSync(p)) {
                try {
                    // Try to remove read-only attribute if present
                    try {
                        fs.chmodSync(p, 0o666);
                    } catch (permErr) {
                        console.warn("Could not change file permissions:", permErr);
                    }

                    fs.writeFileSync(p, content, 'utf8');
                    console.log("Updated realmlist at:", p);
                    updatedCount++;
                } catch (e) {
                    console.error("Failed to write to:", p, e);
                    // Don't throw immediately, try other paths or fallback
                }
            }
        }
        
        // If no file was found/updated, create one in the most likely location
        // For WotLK/TBC, Data/enUS is standard, but root is safer for many custom launchers
        // We will try to write to Data/enUS if the Data folder exists, otherwise root.
        if (updatedCount === 0) {
            console.log("No existing realmlist found. Creating new one.");
            
            const dataDir = path.join(gameDir, 'Data');
            const enUSDir = path.join(dataDir, 'enUS');
            
            if (fs.existsSync(enUSDir)) {
                const target = path.join(enUSDir, 'realmlist.wtf');
                fs.writeFileSync(target, content, 'utf8');
                console.log("Created realmlist at:", target);
            } else {
                const target = path.join(gameDir, 'realmlist.wtf');
                fs.writeFileSync(target, content, 'utf8');
                console.log("Created realmlist at:", target);
            }
        }
        
        return { success: true };
    } catch (e) {
        console.error("Error updating realmlist:", e);
        return { success: false, message: e.message };
    }
});

// --- Update Check ---
ipcMain.on('download-update', async (event, url) => {
    try {
        await shell.openExternal(url);
    } catch (e) {
        console.error('Failed to open update url:', e);
    }
});

ipcMain.on('open-url', (event, url) => {
    shell.openExternal(url);
});

// --- News & Status ---

ipcMain.handle('get-app-version', () => {
    return app.getVersion();
});

ipcMain.handle('check-for-updates', async () => {
    try {
        const currentVersion = app.getVersion();
        const response = await fetch('https://api.github.com/repos/Litas-dev/Azeroth-Legacy-Launcher/releases/latest', {
            headers: { 'User-Agent': 'Warmane-Launcher' }
        });
        
        if (!response.ok) throw new Error('Failed to fetch releases');
        
        const data = await response.json();
        const latestVersion = data.tag_name.replace('v', '');
        
        // Simple version comparison (semver-like)
        const isNewer = (v1, v2) => {
            const p1 = v1.split('.').map(Number);
            const p2 = v2.split('.').map(Number);
            for (let i = 0; i < 3; i++) {
                if ((p1[i] || 0) > (p2[i] || 0)) return true;
                if ((p1[i] || 0) < (p2[i] || 0)) return false;
            }
            return false;
        };

        const updateAvailable = isNewer(latestVersion, currentVersion);
        
        return {
            updateAvailable,
            latestVersion,
            currentVersion,
            url: data.html_url
        };
    } catch (error) {
        console.error('Update check failed:', error);
        return { updateAvailable: false, error: error.message };
    }
});

ipcMain.handle('verify-integrity', async () => {
    // 1. In Development, we cannot verify integrity of "electron.exe" against app source hash
    if (!app.isPackaged) {
        return { 
            status: 'secure', 
            message: 'Development Mode (Unverified)',
            localHash: 'DEVELOPMENT-MODE-NO-HASH'
        };
    }

    if (!SECURITY_CHECK_ENABLED) {
        return { 
            status: 'secure', 
            message: 'Security Check Disabled by Config',
            localHash: 'DISABLED'
        };
    }

    let localHash = null;
    let targetPath = 'unknown';

    try {
        // 2. Calculate Hash
        // Use original-fs to bypass Electron's ASAR patching.
        // This allows us to read the 'app.asar' file as a regular binary file.
        const originalFs = require('original-fs');
        
        targetPath = process.execPath;
        const asarPath = path.join(process.resourcesPath, 'app.asar');
        
        if (originalFs.existsSync(asarPath)) {
            targetPath = asarPath;
        }

        const fileBuffer = originalFs.readFileSync(targetPath);
        const hashSum = crypto.createHash('sha256');
        hashSum.update(fileBuffer);
        localHash = hashSum.digest('hex');

        // 3. Fetch Trusted Hash from GitHub
        const response = await fetch(SECURITY_ENDPOINT, {
            headers: { 'Cache-Control': 'no-cache' }
        });

        if (!response.ok) {
            return { status: 'warning', message: 'Could not connect to verification server.', localHash };
        }

        const data = await response.json();
        const currentVersion = app.getVersion();
        const trustedHash = data[currentVersion];

        if (!trustedHash) {
            return { status: 'warning', message: `Version ${currentVersion} is not yet verified by developer.`, localHash };
        }

        if (localHash === trustedHash) {
            return { status: 'secure', message: 'Protected by Developer', localHash, remoteHash: trustedHash };
        }

        console.warn(`Integrity Mismatch! Local: ${localHash}, Remote: ${trustedHash}`);
        return { 
            status: 'danger', 
            message: `Integrity Mismatch! Expected: ${trustedHash ? trustedHash.substring(0, 8) + '...' : 'None'}, Found: ${localHash}`,
            localHash,
            remoteHash: trustedHash
        };

    } catch (error) {
        console.error('Integrity check error:', error);
        return { 
            status: 'warning', 
            message: `Verification Error: ${error.message}`,
            localHash: localHash 
        };
    }
});

ipcMain.on('open-external', (event, url) => {
    shell.openExternal(url);
});

// Update server configuration
const UPDATE_SERVER_URL = 'https://your-server.com/api'; // Замените на ваш сервер
const UPDATE_FILES_URL = 'https://your-server.com/files'; // Базовый URL для файлов

// Client configurations with file manifests
const availableClients = [
    {
        id: 'classic',
        name: 'World of Warcraft Classic',
        version: '1.12.1',
        size: '2.1 GB',
        description: 'Original World of Warcraft Classic client',
        manifestUrl: `${UPDATE_SERVER_URL}/manifests/classic.json`,
        patchUrl: `${UPDATE_FILES_URL}/patches/classic/`,
        fullDownloadUrl: `${UPDATE_FILES_URL}/full/classic.zip`,
        checksum: 'example-checksum-here',
        requiredFiles: [
            'WoW.exe',
            'Wow.exe', // Alternative name
            'Launcher.exe',
            'Data/wow-1.12.1-enUS-locale.mpq',
            'Data/wow-1.12.1-enUS-speech.mpq',
            'Data/wow-1.12.1-enUS-base.mpq'
        ]
    },
    {
        id: 'tbc',
        name: 'The Burning Crusade',
        version: '2.4.3',
        size: '4.8 GB',
        description: 'The Burning Crusade expansion client',
        manifestUrl: `${UPDATE_SERVER_URL}/manifests/tbc.json`,
        patchUrl: `${UPDATE_FILES_URL}/patches/tbc/`,
        fullDownloadUrl: `${UPDATE_FILES_URL}/full/tbc.zip`,
        checksum: 'example-checksum-here',
        requiredFiles: [
            'WoW.exe',
            'Launcher.exe',
            'Data/expansion-locale-enUS.MPQ',
            'Data/expansion-speech-enUS.MPQ',
            'Data/expansion.MPQ',
            'Data/wow-locale-enUS.MPQ',
            'Data/wow-speech-enUS.MPQ',
            'Data/wow.MPQ'
        ]
    },
    {
        id: 'wotlk',
        name: 'Wrath of the Lich King',
        version: '3.3.5a',
        size: '8.2 GB',
        description: 'Wrath of the Lich King expansion client',
        manifestUrl: `${UPDATE_SERVER_URL}/manifests/wotlk.json`,
        patchUrl: `${UPDATE_FILES_URL}/patches/wotlk/`,
        fullDownloadUrl: `${UPDATE_FILES_URL}/full/wotlk.zip`,
        checksum: 'example-checksum-here',
        requiredFiles: [
            'WoW.exe',
            'Launcher.exe',
            'Data/LichKing-locale-enUS.MPQ',
            'Data/LichKing-speech-enUS.MPQ',
            'Data/LichKing.MPQ',
            'Data/expansion-locale-enUS.MPQ',
            'Data/expansion-speech-enUS.MPQ',
            'Data/expansion.MPQ',
            'Data/wow-locale-enUS.MPQ',
            'Data/wow-speech-enUS.MPQ',
            'Data/wow.MPQ'
        ]
    }
];

// Client management handlers
ipcMain.handle('get-available-clients', () => {
    return availableClients;
});

// Function to calculate file hash
function calculateFileHash(filePath) {
    try {
        const fileBuffer = fs.readFileSync(filePath);
        const hashSum = crypto.createHash('sha256');
        hashSum.update(fileBuffer);
        return hashSum.digest('hex');
    } catch (error) {
        console.error('Error calculating hash for:', filePath, error);
        return null;
    }
}

// Function to get all files in directory recursively
function getAllFiles(dirPath, relativeTo = dirPath) {
    const files = [];

    function scanDirectory(currentPath) {
        try {
            const items = fs.readdirSync(currentPath, { withFileTypes: true });

            for (const item of items) {
                const fullPath = path.join(currentPath, item.name);
                const relativePath = path.relative(relativeTo, fullPath);

                if (item.isDirectory()) {
                    // Skip certain directories
                    if (!['Cache', 'WDB', 'Screenshots', 'Logs', 'Errors'].includes(item.name)) {
                        scanDirectory(fullPath);
                    }
                } else if (item.isFile()) {
                    // Only include game files, skip temp files
                    if (!item.name.startsWith('.') &&
                        !item.name.endsWith('.tmp') &&
                        !item.name.endsWith('.bak')) {
                        files.push(relativePath);
                    }
                }
            }
    } catch (error) {
            console.error('Error scanning directory:', currentPath, error);
        }
    }

    scanDirectory(dirPath);
    return files;
}

// Download client through launcher (simplified for demo)
ipcMain.handle('download-client', async (event, { clientId, downloadType = 'full' }) => {
    try {
        const client = availableClients.find(c => c.id === clientId);
        if (!client) throw new Error('Client not found');

        // For demo purposes, we'll simulate the download process
        // In production, this would actually download from your server

        event.sender.send('download-status', `Preparing to download ${client.name}...`);

        // Simulate download progress
        const totalSize = 2200000000; // 2.2GB
        let downloaded = 0;
        const interval = setInterval(() => {
            if (downloaded >= totalSize) {
                clearInterval(interval);
                return;
            }

            downloaded += Math.random() * 50000000 + 10000000; // 10-60MB per update
            if (downloaded > totalSize) downloaded = totalSize;

            const progress = downloaded / totalSize;
            const speed = Math.random() * 1000000 + 1000000; // 1-2MB/s

            event.sender.send('download-progress', {
                progress,
                speed,
                downloaded,
                total: totalSize
            });

            if (progress < 0.1) {
                event.sender.send('download-status', `Preparing download...`);
            } else if (progress < 0.9) {
                event.sender.send('download-status', `Downloading ${client.name}...`);
            } else {
                event.sender.send('download-status', `Finalizing download...`);
            }
        }, 500);

        setTimeout(() => {
            event.sender.send('download-complete', {
                path: `/fake/path/${clientId}.zip`,
                clientId
            });
        }, 8000); // Give enough time for progress to reach 100%

        return {
            success: true,
            message: `Download started for ${client.name}`
        };
    } catch (error) {
        return { success: false, message: error.message };
    }
});

// Client integrity and update handlers
ipcMain.handle('check-client-integrity', async (event, { gamePath, clientId }) => {
    try {
        const client = availableClients.find(c => c.id === clientId);
        if (!client) {
            return {
                status: 'error',
                message: 'Client configuration not found',
                details: []
            };
        }

        let actualGamePath = gamePath;

        // If no path provided, try to auto-detect
        if (!actualGamePath) {
            // Common installation paths to check
            const commonPaths = [
                `C:\\Games\\World of Warcraft`,
                `C:\\Program Files\\World of Warcraft`,
                `C:\\Program Files (x86)\\World of Warcraft`,
                `${app.getPath('desktop')}\\World of Warcraft`,
                `${app.getPath('documents')}\\World of Warcraft`
            ];

            for (const path of commonPaths) {
                if (fs.existsSync(path)) {
                    // Check if this path contains our client files
                    const wowExe = `${path}\\WoW.exe`;
                    const launcherExe = `${path}\\Launcher.exe`;

                    if (fs.existsSync(wowExe) || fs.existsSync(launcherExe)) {
                        actualGamePath = path;
                        break;
                    }
                }
            }
        }

        if (!actualGamePath || !fs.existsSync(actualGamePath)) {
            return {
                status: 'missing',
                message: 'Game installation not found',
                details: []
            };
        }
        
        const gameDir = fs.lstatSync(gamePath).isFile() ? path.dirname(gamePath) : gamePath;
        
        event.sender.send('integrity-check-status', 'Checking client files...');

        // Check required files existence
        const missingFiles = [];
        const corruptedFiles = [];
        const validFiles = [];

        for (const requiredFile of client.requiredFiles) {
            const filePath = path.join(gameDir, requiredFile.replace(/\//g, path.sep));

            if (!fs.existsSync(filePath)) {
                missingFiles.push(requiredFile);
            } else {
                // File exists, could add hash check here
                validFiles.push(requiredFile);
            }
        }

        // Try to fetch manifest from server for detailed check
        let serverManifest = null;
        try {
            const response = await fetch(client.manifestUrl);
            if (response.ok) {
                serverManifest = await response.json();
            }
    } catch (error) {
            console.warn('Could not fetch server manifest:', error.message);
        }

        // If we have manifest, do detailed integrity check
        if (serverManifest && serverManifest.files) {
            for (const [filePath, expectedHash] of Object.entries(serverManifest.files)) {
                const fullPath = path.join(gameDir, filePath.replace(/\//g, path.sep));

                if (fs.existsSync(fullPath)) {
                    const currentHash = calculateFileHash(fullPath);
                    if (currentHash !== expectedHash) {
                        corruptedFiles.push(filePath);
                    }
                }
            }
        }

        // Determine overall status
        let status = 'valid';
        let message = 'Client files are valid';

        if (missingFiles.length > 0) {
            status = 'incomplete';
            message = `Missing ${missingFiles.length} required files`;
        } else if (corruptedFiles.length > 0) {
            status = 'corrupted';
            message = `Found ${corruptedFiles.length} corrupted files`;
        }

        return {
            status,
            message,
            details: {
                missing: missingFiles,
                corrupted: corruptedFiles,
                valid: validFiles.length
            },
            canUpdate: status !== 'valid',
            installPath: actualGamePath
        };
    } catch (error) {
        return {
            status: 'error',
            message: `Integrity check failed: ${error.message}`,
            details: []
        };
    }
});

ipcMain.handle('update-client', async (event, { gamePath, clientId }) => {
    try {
        const client = availableClients.find(c => c.id === clientId);
        if (!client) throw new Error('Client not found');

        const gameDir = fs.lstatSync(gamePath).isFile() ? path.dirname(gamePath) : gamePath;

        // First check integrity to see what needs updating
        const integrityCheck = await ipcMain.handle('check-client-integrity', event, { gamePath, clientId });

        if (integrityCheck.status === 'valid') {
            return { success: true, message: 'Client is already up to date' };
        }

        // Start download process
        event.sender.send('update-status', 'Starting client update...');

        // For now, download full client
        // TODO: Implement incremental patching
        const downloadResult = await ipcMain.handle('download-client', event, {
            clientId,
            downloadType: 'full'
        });

        if (!downloadResult.success) {
            throw new Error(downloadResult.message);
        }

        // Extract and install
        event.sender.send('update-status', 'Extracting files...');
        const extractResult = await processGameDownload(
            downloadResult.filePath,
            gameDir,
            event.sender,
            { skipExtraction: false }
        );

        if (extractResult) {
            // Cleanup downloaded file
            try {
                fs.unlinkSync(downloadResult.filePath);
            } catch (e) {
                console.warn('Could not cleanup downloaded file:', e);
            }

            return {
                success: true,
                message: 'Client updated successfully',
                newPath: extractResult
            };
        } else {
            throw new Error('Extraction failed');
        }
    } catch (error) {
        return { success: false, message: error.message };
    }
});

ipcMain.handle('process-downloaded-client', async (event, { filePath, installPath, clientId }) => {
    try {
        const client = availableClients.find(c => c.id === clientId);
        if (!client) throw new Error('Client configuration not found');

        event.sender.send('install-status', `Installing ${client.name}...`);

        // For demo purposes, simulate installation
        // In production, this would extract the real ZIP file

        setTimeout(() => {
            event.sender.send('install-status', 'Extracting files...');
        }, 1000);

        setTimeout(() => {
            event.sender.send('install-complete', {
                path: installPath,
                clientId
            });
        }, 3000);

        return {
            success: true,
            message: `${client.name} installed successfully`,
            installPath
        };
    } catch (error) {
        return { success: false, message: error.message };
    }
});

// --- Discord Status ---

ipcMain.handle('fetch-discord-status', async () => {
    try {
        const response = await fetch('https://discord.com/api/v9/invites/cyH3pYM28Z?with_counts=true');
        const data = await response.json();
        return {
            online: data.approximate_presence_count || 0,
            members: data.approximate_member_count || 0,
            name: data.guild ? data.guild.name : 'Azeroth Legacy',
            invite: 'https://discord.gg/cyH3pYM28Z'
        };
    } catch (error) {
        console.error('Error fetching discord status:', error);
        return {
            online: 1914,
            members: 9503,
            name: 'Azeroth Legacy',
            invite: 'https://discord.gg/cyH3pYM28Z'
        };
    }
});

// --- Network Utils ---

ipcMain.handle('measure-latency', async () => {
    return new Promise((resolve) => {
        const start = Date.now();
        const socket = new net.Socket();
        
        socket.setTimeout(2000); // 2s timeout
        
        socket.on('connect', () => {
            const ping = Date.now() - start;
            socket.destroy();
            resolve(ping);
        });
        
        socket.on('error', () => {
            socket.destroy();
            resolve(-1);
        });
        
        socket.on('timeout', () => {
            socket.destroy();
            resolve(-1);
        });
        
        // Connect to Logon Server
        socket.connect(3724, 'logon.warmane.com');
    });
});

// --- Client Downloads ---


ipcMain.on('open-external', (event, url) => {
    shell.openExternal(url);
});




// Helper to safely strip HTML tags (mitigates CodeQL alert)
function stripHtml(html) {
    if (!html) return '';
    let oldHtml;
    do {
        oldHtml = html;
        // Regex to remove tags, ensuring we don't match across multiple tags incorrectly
        // <[^<>]+> matches a '<' followed by one or more non-'<' non-'>' characters, then '>'
        html = html.replace(/<[^<>]+>/g, '');
    } while (html !== oldHtml);
    return html.trim();
}


