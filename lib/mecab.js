
const fs            = require('fs');
const path          = require('path');
const debugAddon    = path.join(__dirname, '/../build/Debug/mecab.node');
const releaseAddon  = path.join(__dirname, '/../build/Release/mecab.node');
const addonFileName = ((fs.existsSync(debugAddon)) ? debugAddon : releaseAddon);
const addonModule    = require(addonFileName);

module.exports = addonModule;