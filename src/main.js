// eslint-disable global-require

const path = require('path');
const { app, BrowserWindow } = require('electron');
const { fork } = require('child_process');
const isDev = require('electron-is-dev');
const findOpenSocket = require('./utils/find-open-socket');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let serverWindow;
let serverProcess;

function createWindow(socketName) {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('set-socket', {
      name: socketName,
    });
  });

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

function createBackgroundWindow(socketName) {
  const win = new BrowserWindow({
    x: 500,
    y: 300,
    width: 700,
    height: 500,
    show: true,
    webPreferences: {
      nodeIntegration: true,
    },
  });
  win.loadURL(SERVER_WEBPACK_ENTRY);

  win.webContents.on('did-finish-load', () => {
    win.webContents.send('set-socket', { name: socketName });
  });

  serverWindow = win;

  serverWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    serverWindow = null;
  });
}

function createBackgroundProcess(socketName) {
  serverProcess = fork(path.resolve(__dirname, '../renderer/server/index.js'), [
    '--subprocess',
    app.getVersion(),
    socketName,
  ]);

  serverProcess.on('message', msg => {
    console.log(msg);
  });
}

const bootstrap = async () => {
  serverSocket = await findOpenSocket();

  createWindow(serverSocket);

  if (isDev) {
    createBackgroundWindow(serverSocket);
  } else {
    createBackgroundProcess(serverSocket);
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', bootstrap);

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    bootstrap();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
