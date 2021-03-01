const { app, BrowserWindow, ipcMain, dialog } = require('electron')
var rtcppjs = require('./rtcppjs.js');
const url = require('url') 
const path = require('path')  
const fs = require('fs') 

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 800,
    backgroundColor: '#FFF',
    webPreferences: {
      nodeIntegration: true
    }
  })

  win.loadFile('index.html')
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})


ipcMain.on('eventSelectFile', event => { 
  const options = {
    title: 'Select rtpdump for analyze',
    buttonLabel: 'Analyze',
  };

  dialog.showOpenDialog(null, options).then(dialogResult => {
    if (!dialogResult.canceled) {
      let fPath = dialogResult.filePaths[0];
      let fileName = path.basename(fPath);
      let filePath = path.dirname(fPath);

      rtcppjs().then((instance) => {
        let analyze = instance.analyzeRTPDump(filePath, fileName);
        if (analyze.length === 0) {
          throw "Bad file";
        }

        event.reply('eventFileSelected', {fileName, filePath, analyze});

      }).catch(error => {
        event.reply('eventFileSelected', {fileName, filePath, error});
      });
    } else {
      event.reply('eventFileSelected', {error : "File isn't selected"});
    }
   }).catch(error => {
     event.reply('eventFileSelected', {error});
   })

})  


ipcMain.on('eventProcessFile', (event, fileCfg) => { 
  console.log(fileCfg);

  fileCfg.outFileName = "processed_" + fileCfg.fileName;

  rtcppjs().then((instance) => {
    // create file, so c++ code could write to it
    // for some reasons emscripted can't create file in some directories
    fs.openSync(path.join(fileCfg.filePath, fileCfg.outFileName), "w");

    let result = instance.transformRTPDump(fileCfg.filePath, 
      fileCfg.fileName, 
      fileCfg.outFileName,
      JSON.stringify(fileCfg.streamsCfg));

    if (result.length > 0) {
      throw "Transform has failed - " + result;
    }
    event.reply('eventFileProcessed', fileCfg);

  }).catch(error => {
    event.reply('eventFileProcessed', { error });
  });
})  
