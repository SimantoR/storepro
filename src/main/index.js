'use strict';
import env from 'common/env';
import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { format as formatUrl } from 'url';
// import initDevTools from './dev/initDevTools'

// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow;
let loadWindow;

function createMainWindow() {
  const window = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      devTools: true,
      webSecurity: false,
    },
    title: 'Store Pro',
    fullscreenable: true,
    minWidth: 900,
    minHeight: 700,
  });

  // window.setFullScreen(true)

  let url;

  if (env.isDevelopment) {
    url = `http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`;
    // initDevTools(window, true)
  } else {
    url = formatUrl({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file',
      slashes: true,
    });
  }

  window.on('error', (error) => {
    console.error({
      error,
    });
  });
  window.on('closed', () => {
    mainWindow = null;
  });

  window.loadURL(url);
  window.hide();

  return window;
}

function createLoadWindow() {
  const window = new BrowserWindow({
    width: 400,
    height: 250,
    frame: false,
    transparent: true,
    resizable: false,
  });

  let url = formatUrl({
    pathname: path.join(__dirname, 'loading.html'),
    protocol: 'file',
    slashes: true,
  });

  console.log(`File URL: ${url}`);
  window.loadFile(__static + '/loading.html');
  window.on('closed', () => (loadWindow = null));

  return window;
}

// quit application when all windows are closed
app.on('window-all-closed', () => {
  // on macOS it is common for applications to stay open until the user explicitly quits
  if (process.platform !== 'darwin') {
    app.quit();
  }
  app.quit();
});

// app.on('activate', () => {
//   // on macOS it is common to re-create a window even after all windows have been closed
//   if (mainWindow === null) {
//     mainWindow = createMainWindow()
//   }
// })

// create main BrowserWindow when electron is ready
app.on('ready', () => {
  let _loadWindow = createLoadWindow();
  _loadWindow.hide();
  let _mainWindow = createMainWindow();

  _mainWindow.show();
});

if (module.hot) {
  module.hot.accept();
}
