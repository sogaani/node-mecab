const fs = require('fs');
const util = require('util');
const writeFile = util.promisify(fs.writeFile);
const ChildProcess = require('child_process');
const path = require('path');
const patch = require('./apply-patch');

let request, unzip, gyp, fsExt; //these are dynamically required later on

const TEMP_PATH = path.join(require('os').tmpdir(), '/mecab-' + Math.random().toString(36).substring(7));
const INSTALL_PATH = path.join(__dirname, '/../mecab/');
const MECAB_SOURCE_URL = 'https://github.com/taku910/mecab/archive/master.zip';

const configGyp = {
  "targets": [
    {
      "target_name": "libmecab",
      "type": "static_library",
      "sources": [
        "viterbi.cpp", "tagger.cpp", "utils.cpp", "eval.cpp",
        "iconv_utils.cpp", "dictionary_rewriter.cpp", "dictionary_generator.cpp",
        "dictionary_compiler.cpp", "context_id.cpp", "connector.cpp",
        "nbest_generator.cpp", "writer.cpp", "string_buffer.cpp", "param.cpp",
        "tokenizer.cpp", "char_property.cpp", "dictionary.cpp", "feature_index.cpp",
        "lbfgs.cpp", "learner_tagger.cpp", "learner.cpp", "libmecab.cpp"],
      "include_dirs": [
        path.join(TEMP_PATH, "/mecab/mecab-master/mecab/src/"),
        path.join(TEMP_PATH, "/mecab/mecab-master/mecab/"),
      ],
      "conditions": [
        ['OS=="win"', {
          'defines': [
            '_CRT_SECURE_NO_DEPRECATE',
            'MECAB_USE_THREAD',
            'DLL_EXPORT',
            'HAVE_GETENV',
            'HAVE_WINDOWS_H',
            'DIC_VERSION=102',
            'VERSION="0.996"',
            'PACKAGE="mecab"',
            'UNICODE',
            '_UNICODE',
            'MECAB_DEFAULT_RC="c:\\Program Files\\mecab\\etc\\mecabrc"',
          ],
        }],
      ]
    }
  ]
};

function init() {
  console.log('Temp Path:', TEMP_PATH);
  console.log('Install Path:', INSTALL_PATH);
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    request({ uri: url })
      .pipe(fs.createWriteStream(dest))
      .on('close', () => {
        resolve();
      })
      .on('error', (e) => {
        reject(e);
      });
  });
}

function extract(src, dest) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(src)
      .pipe(unzip.Extract({ path: dest }))
      .on('close', () => {
        resolve()
      })
      .on('error', (e) => {
        reject(e);
      });
  });
}


function buildOnUnix() {
  fs.chmodSync(TEMP_PATH + '/mecab/mecab-master/mecab/configure', '755');
  ChildProcess.execSync('./configure', {
    cwd: TEMP_PATH + '/mecab/mecab-master/mecab/',
    stdio: 'inherit'
  });
  ChildProcess.execSync('make', {
    cwd: TEMP_PATH + '/mecab/mecab-master/mecab/',
    stdio: 'inherit'
  });
}

async function buildOnWindows() {
  process.chdir(TEMP_PATH + '/mecab/mecab-master/mecab/src/');

  const patchFile = path.join(__dirname, '../mecab/patch')
  const targetDir = path.join(TEMP_PATH, '/mecab/')
  patch(patchFile, 1, targetDir);

  await writeFile(TEMP_PATH + '/mecab/mecab-master/mecab/src/binding.gyp', JSON.stringify(configGyp, null, 4));
  const args = ['node', '.'];
  gyp.parseArgv(args);

  return new Promise((resolve, reject) => {
    gyp.commands.clean([], (err) => {
      if (err) return reject(err);
      gyp.commands.configure([], (err) => {
        if (err) return reject(err);
        gyp.commands.build([], (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    });
  })

}

async function build() {
  if (/^win/.test(process.platform)) {
    await buildOnWindows();
  } else {
    buildOnUnix();
  }
}

function copyFiles() {
  fsExt.copySync(TEMP_PATH + '/mecab/mecab-master/mecab/src/mecab.h', INSTALL_PATH + 'mecab.h');
  if (/^win/.test(process.platform)) {
    fsExt.copySync(TEMP_PATH + '/mecab/mecab-master/mecab/src/build/Release/libmecab.lib', INSTALL_PATH + 'libmecab.lib');
  } else {
    fsExt.copySync(TEMP_PATH + '/mecab/mecab-master/mecab/src/.libs/libmecab.so', INSTALL_PATH + 'libmecab.so');
    fsExt.copySync(TEMP_PATH + '/mecab/mecab-master/mecab/src/.libs/libmecab.so.2', INSTALL_PATH + 'libmecab.so.2');
    fsExt.copySync(TEMP_PATH + '/mecab/mecab-master/mecab/src/.libs/libmecab.so.2.0.0', INSTALL_PATH + 'libmecab.so.2.0.0');
  }
}

module.exports = async function () {
  fs.mkdirSync(TEMP_PATH);

  process.chdir(TEMP_PATH);
  console.log('Installing dependencies to ' + TEMP_PATH);
  ChildProcess.execSync('npm install request node-gyp unzip fs-extra');
  request = require(TEMP_PATH + '/node_modules/request');
  unzip = require(TEMP_PATH + '/node_modules/unzip');
  gyp = require(TEMP_PATH + '/node_modules/node-gyp')();
  fsExt = require(TEMP_PATH + '/node_modules/fs-extra');

  init();

  console.log('Downloading mecab source.');
  await download(MECAB_SOURCE_URL, TEMP_PATH + '/mecab.zip');

  console.log('Extracting mecab source.');
  await extract(TEMP_PATH + '/mecab.zip', TEMP_PATH + '/mecab');

  console.log('Building mecab source.');
  await build();

  console.log('Copying mecab to ' + INSTALL_PATH);
  copyFiles();
}

if (require.main === module) {
  module.exports();
}
