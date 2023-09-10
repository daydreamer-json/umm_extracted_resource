const log4js = require('log4js');
var logger = log4js.getLogger('default');
logger.level = 'all';
logger.debug('Loaded module: log4js');
logger.debug('Logger has been initialized');
const arg = process.argv.slice(2);
logger.debug(`Received arguments: ${JSON.stringify(arg)}`);
const fs = require('fs');
logger.debug('Loaded module: fs');
const path = require('path');
logger.debug('Loaded module: path');
const { exec } = require('child_process');
const { spawn } = require('child_process');
logger.debug('Loaded module: child_process');
const request = require('request');
logger.debug('Loaded module: request');
const sqlite3 = require("sqlite3");
logger.debug('Loaded module: sqlite3');
const db = new sqlite3.Database('db/meta');
const master_db = new sqlite3.Database('db/master/master.mdb');
logger.debug('SQLite database has been initialized');

const CONFIG = {
  'assetInitialPath': 'D:\\Games\\Umamusume\\Cygames\\umamusume',
  'assetUrlBase': 'https://prd-storage-umamusume.akamaized.net/dl/resources',
  'assetUrlPathUnique': 'Windows/assetbundles',
  'assetUrlPathCompatible': 'Generic',
  'assetRenameOutputPath': 'assets',
  'assetConvertedOutputPath': 'assets_converted'
};

// assetUrlBase specifies the base address of the asset, but the path is different if the `k` field in `meta` is greater than 10.
// k<10 : Windows/assetbundles
// k>=10 : Generic

// ========== Base Function area ==========

function formatFileSize (bytes, decimals = 2) {
  if (bytes === 0) return '0 byte';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function parsingVgmstreamInfoToJson (stdout, path) {
  let stdout_array_all = new Array();
  let output_array = new Array();
  for (let p = 0; p < stdout.split('metadata for ').filter(Boolean).length; p++) {
    let splitted_temp01 = stdout.split('metadata for ').filter(Boolean)[p].split('\r\n');
    stdout_array_all.push(splitted_temp01.filter(Boolean));
  }
  stdout_array_all.forEach(stdout_array => {
    let output_obj = {
      'path': path.replace(CONFIG.assetConvertedOutputPath, '').replace(CONFIG.assetRenameOutputPath, '').replace(/^(\/|\\)/, ''),
      'codec': null,
      'metadataFormat': null,
      'channels': null,
      'channelMask': null,
      'layout': null,
      'sampleRate': null,
      'bitRate': null,
      'samples': null,
      'durationMs': null,
      'looping': null,
      'loopStartSample': null,
      'loopEndSample': null,
      'loopStartTimeMs': null,
      'loopEndTimeMs': null,
      'streamName': null
    };
    if (stdout_array.filter((item) => item.startsWith('encoding: ')).length !== 0) {
      output_obj.codec = stdout_array.filter((item) => item.startsWith('encoding: '))[0].replace("encoding: ", "");
    }
    if (stdout_array.filter((item) => item.startsWith('metadata from: ')).length !== 0) {
      output_obj.metadataFormat = stdout_array.filter((item) => item.startsWith('metadata from: '))[0].replace("metadata from: ", "");
    }
    if (stdout_array.filter((item) => item.startsWith('channels: ')).length !== 0) {
      output_obj.channels = parseFloat(stdout_array.filter((item) => item.startsWith('channels: '))[0].replace("channels: ", ""));
    }
    if (stdout_array.filter((item) => item.startsWith('channel mask: ')).length !== 0) {
      output_obj.channelMask = parseInt(stdout_array.filter((item) => item.startsWith('channel mask: '))[0].replace("channel mask: ", "").replace(/ \/ .*/g, ''), 16);
    }
    if (stdout_array.filter((item) => item.startsWith('layout: ')).length !== 0) {
      output_obj.layout = stdout_array.filter((item) => item.startsWith('layout: '))[0].replace("layout: ", "");
    }
    if (stdout_array.filter((item) => item.startsWith('sample rate: ')).length !== 0) {
      output_obj.sampleRate = parseFloat(stdout_array.filter((item) => item.startsWith('sample rate: '))[0].replace("sample rate: ", "").replace(' Hz', ''));
    }
    if (stdout_array.filter((item) => item.startsWith('bitrate: ')).length !== 0) {
      output_obj.bitRate = parseFloat(stdout_array.filter((item) => item.startsWith('bitrate: '))[0].replace("bitrate: ", "").replace(' kbps', '')) * 1000;
    }
    if (stdout_array.filter((item) => item.startsWith('stream total samples: ')).length !== 0) {
      output_obj.samples = parseInt(stdout_array.filter((item) => item.startsWith('stream total samples: '))[0].replace("stream total samples: ", "").match(/\d+/g)[0]);
      let duration_minute = parseInt(stdout_array.filter((item) => item.startsWith('stream total samples: '))[0].replace("stream total samples: ", "").match(/\d+/g)[1]);
      let duration_second = parseInt(stdout_array.filter((item) => item.startsWith('stream total samples: '))[0].replace("stream total samples: ", "").match(/\d+/g)[2]);
      let duration_float = parseInt(stdout_array.filter((item) => item.startsWith('stream total samples: '))[0].replace("stream total samples: ", "").match(/\d+/g)[3]);
      output_obj.durationMs = parseInt((duration_minute * 60 + duration_second) * 1000 + duration_float);
    }
    if (stdout_array.filter((item) => item.startsWith('loop start: ')).length !== 0 && stdout_array.filter((item) => item.startsWith('loop end: ')).length !== 0) {
      output_obj.loopStartSample = parseInt(stdout_array.filter((item) => item.startsWith('loop start: '))[0].replace("loop start: ", "").match(/\d+/g)[0]);
      let duration_minute_start = parseInt(stdout_array.filter((item) => item.startsWith('loop start: '))[0].replace("loop start: ", "").match(/\d+/g)[1]);
      let duration_second_start = parseInt(stdout_array.filter((item) => item.startsWith('loop start: '))[0].replace("loop start: ", "").match(/\d+/g)[2]);
      let duration_float_start = parseInt(stdout_array.filter((item) => item.startsWith('loop start: '))[0].replace("loop start: ", "").match(/\d+/g)[3]);
      output_obj.loopStartTimeMs = parseInt((duration_minute_start * 60 + duration_second_start) * 1000 + duration_float_start);
      output_obj.loopEndSample = parseInt(stdout_array.filter((item) => item.startsWith('loop end: '))[0].replace("loop end: ", "").match(/\d+/g)[0]);
      let duration_minute_end = parseInt(stdout_array.filter((item) => item.startsWith('loop end: '))[0].replace("loop end: ", "").match(/\d+/g)[1]);
      let duration_second_end = parseInt(stdout_array.filter((item) => item.startsWith('loop end: '))[0].replace("loop end: ", "").match(/\d+/g)[2]);
      let duration_float_end = parseInt(stdout_array.filter((item) => item.startsWith('loop end: '))[0].replace("loop end: ", "").match(/\d+/g)[3]);
      output_obj.loopEndTimeMs = parseInt((duration_minute_end * 60 + duration_second_end) * 1000 + duration_float_end);
      output_obj.looping = true;
    } else {
      output_obj.looping = false;
    }
    if (stdout_array.filter((item) => item.startsWith('stream name: ')).length !== 0) {
      output_obj.streamName = stdout_array.filter((item) => item.startsWith('stream name: '))[0].replace("stream name: ", "");
    }
    output_array.push(output_obj);
  });
  return output_array
}

// ========== Function area ==========

function showHelpMsg () {
  logger.debug('Help displayed');
  let commandList = [
    'help',
    'showTableListOfDatabase',
    'showTableListOfMasterDatabase',
    'saveDatabaseTableToJsonFile',
    'saveAllDatabaseTableToJsonFile',
    'saveAllMasterDatabaseTableToJsonFile',
    'outputOndemandAsset',
    'outputInternalAsset',
    'copySpecifiedAsset',
    'encodeSoundAssetAwb',
    'convertWavToFlacRecursive',
    'showCriAudioMetadata'
  ];
  console.log(`\nUsage: node ${path.basename(process.argv[1])} COMMAND [VALUE]\n\nCommands:\n  ${commandList.join('\n  ')}\n\nsaveDatabaseTableToJsonFile:\n  value: tableName\n\ncopySpecifiedAsset:\n  value: nameStartsWith\n\nencodeSoundAssetAwb:\n  value: nameStartsWith`);
}

function saveDatabaseTableToJsonFile (table) {
  logger.debug(`Checking for the existence of 'db/meta' ...`);
  fs.exists(`db/meta`, (exists) => {
    if (exists) {
      logger.debug(`'db/meta' file found`);
      logger.debug(`Checking for the existence of 'db/meta_json/' ...`);
      fs.exists(`db/meta_json`, (exists) => {
        if (!exists) {
          logger.debug(`'db/meta_json' directory not found`);
          fs.mkdir(`db/meta_json`, {recursive: true}, (err) => {
            if (err) throw err;
            logger.debug(`'db/meta_json/' directory created`);
          });
        } else {
          logger.debug(`'db/meta_json' directory found`);
        }
      });
      logger.debug(`Loading database table '${table}' ...`);
      db.serialize(() => {
        db.all(`SELECT * FROM ${table}`, (err, rows) => {
          if (err) throw err;
          logger.debug('Database loaded successfully');
          fs.exists(`db/meta_json/${table}.json`, (exists) => {
            logger.debug(`Checking for the existence of 'db/meta_json/${table}.json' ...`);
            if (exists) {
              logger.debug(`'db/meta_json/${table}.json' file found`);
              logger.debug(`Overwriting 'db/meta_json/${table}.json' file ...`);
              fs.unlink(`db/meta_json/${table}.json`, (err) => {});
              fs.writeFile(`db/meta_json/${table}.json`, JSON.stringify(rows), {flag: 'a'}, (err) => {
                if (err) throw err;
              });
            } else {
              logger.debug(`'db/meta_json/${table}.json' file not found`);
              logger.debug(`Creating 'db/meta_json/${table}.json' file ...`);
              fs.writeFile(`db/meta_json/${table}.json`, JSON.stringify(rows), {flag: 'a'}, (err) => {
                if (err) throw err;
              });
            }
          });
        });
      });
      db.close();
    } else {
      logger.error(`'db/meta' file not found`);
    }
  });
}

function saveAllDatabaseTableToJsonFile () {
  logger.debug(`Checking for the existence of 'db/meta' ...`);
  fs.exists(`db/meta`, (exists) => {
    if (exists) {
      logger.debug(`'db/meta' file found`);
      logger.debug(`Checking for the existence of 'db/meta_json/' ...`);
      fs.exists(`db/meta_json`, (exists) => {
        if (!exists) {
          logger.debug(`'db/meta_json' directory not found`);
          fs.mkdir(`db/meta_json`, {recursive: true}, (err) => {
            if (err) throw err;
            logger.debug(`'db/meta_json/' directory created`);
          });
        } else {
          logger.debug(`'db/meta_json' directory found`);
        }
      });
      logger.debug(`Loading database ...`);
      db.serialize(() => {
        db.each("select name from sqlite_master where type='table'", function (err, table) {
          if (err) throw err;
          let tableName = table.name;
          logger.debug(`Database table '${tableName}' loaded successfully`);
          db.all(`SELECT * FROM ${tableName}`, (err, rows) => {
            if (err) throw err;
            fs.exists(`db/meta_json/${tableName}.json`, (exists) => {
              logger.debug(`Checking for the existence of 'db/meta_json/${tableName}.json' ...`);
              if (exists) {
                logger.debug(`'db/meta_json/${tableName}.json' file found`);
                logger.debug(`Overwriting 'db/meta_json/${tableName}.json' file ...`);
                fs.unlink(`db/meta_json/${tableName}.json`, (err) => {});
                fs.writeFile(`db/meta_json/${tableName}.json`, JSON.stringify(rows), {flag: 'a'}, (err) => {
                  if (err) throw err;
                });
              } else {
                logger.debug(`'db/meta_json/${tableName}.json' file not found`);
                logger.debug(`Creating 'db/meta_json/${tableName}.json' file ...`);
                fs.writeFile(`db/meta_json/${tableName}.json`, JSON.stringify(rows), {flag: 'a'}, (err) => {
                  if (err) throw err;
                });
              }
            });
          });
        });
      });
      db.close();
    } else {
      logger.error(`'db/meta' file not found`);
    }
  });
}

function saveAllMasterDatabaseTableToJsonFile () {
  logger.debug(`Checking for the existence of 'db/master/master.mdb' ...`);
  fs.exists(`db/master/master.mdb`, (exists) => {
    if (exists) {
      logger.debug(`'db/master/master.mdb' file found`);
      logger.debug(`Checking for the existence of 'db/master/master_json/' ...`);
      fs.exists(`db/master/master_json`, (exists) => {
        if (!exists) {
          logger.debug(`'db/master/master_json' directory not found`);
          fs.mkdir(`db/master/master_json`, {recursive: true}, (err) => {
            if (err) throw err;
            logger.debug(`'db/master/master_json/' directory created`);
          });
        } else {
          logger.debug(`'db/master/master_json' directory found`);
        }
      });
      logger.debug(`Loading database ...`);
      master_db.serialize(() => {
        master_db.each("select name from sqlite_master where type='table'", function (err, table) {
          if (err) throw err;
          let tableName = table.name;
          logger.debug(`Database table '${tableName}' loaded successfully`);
          master_db.all(`SELECT * FROM ${tableName}`, (err, rows) => {
            if (err) throw err;
            fs.exists(`db/master/master_json/${tableName}.json`, (exists) => {
              logger.debug(`Checking for the existence of 'db/master/master_json/${tableName}.json' ...`);
              if (exists) {
                logger.debug(`'db/master/master_json/${tableName}.json' file found`);
                logger.debug(`Overwriting 'db/master/master_json/${tableName}.json' file ...`);
                fs.unlink(`db/master/master_json/${tableName}.json`, (err) => {});
                fs.writeFile(`db/master/master_json/${tableName}.json`, JSON.stringify(rows), {flag: 'a'}, (err) => {
                  if (err) throw err;
                });
              } else {
                logger.debug(`'db/master/master_json/${tableName}.json' file not found`);
                logger.debug(`Creating 'db/master/master_json/${tableName}.json' file ...`);
                fs.writeFile(`db/master/master_json/${tableName}.json`, JSON.stringify(rows), {flag: 'a'}, (err) => {
                  if (err) throw err;
                });
              }
            });
          });
        });
      });
      master_db.close();
    } else {
      logger.error(`'db/master/master.mdb' file not found`);
    }
  });
}

function showTableListOfDatabase () {
  logger.debug(`Checking for the existence of 'db/meta' ...`);
  fs.exists(`db/meta`, (exists) => {
    if (exists) {
      logger.debug(`'db/meta' file found`);
      logger.debug(`Loading database ...`);
      db.serialize(() => {
        db.all("select name from sqlite_master where type='table'", function (err, tables) {
          if (err) throw err;
          console.log(tables.map((l) => l.name).sort().join(' , '));
        });
      });
      db.close();
    } else {
      logger.error(`'db/meta' file not found`);
    }
  });
}

function showTableListOfMasterDatabase () {
  logger.debug(`Checking for the existence of 'db/master/master.mdb' ...`);
  fs.exists(`db/master/master.mdb`, (exists) => {
    if (exists) {
      logger.debug(`'db/master/master.mdb' file found`);
      logger.debug(`Loading database ...`);
      master_db.serialize(() => {
        master_db.all("select name from sqlite_master where type='table'", function (err, tables) {
          if (err) throw err;
          console.log(tables.map((l) => l.name).sort().join(' , '));
        });
      });
      master_db.close();
    } else {
      logger.error(`'db/master/master.mdb' file not found`);
    }
  });
}

function outputOndemandAsset () {
  logger.debug(`Checking for the existence of 'db/meta_json/a.json' ...`);
  fs.exists(`db/meta_json/a.json`, (exists) => {
    if (exists) {
      logger.debug(`'db/meta_json/a.json' file found`);
      logger.debug(`Loading database json ...`);
      fs.readFile(`db/meta_json/a.json`, 'utf8', function (err, dataRaw) {
        let data = JSON.parse(dataRaw);
        logger.debug(`Checking for the existence of 'db/meta_json/a_ondemand.json' ...`);
        fs.exists(`db/meta_json/a_ondemand.json`, (exists) => {
          if (exists) {
            logger.debug(`'db/meta_json/a_ondemand.json' file found`);
            logger.debug(`Overwriting 'db/meta_json/a_ondemand.json' file ...`);
            fs.unlink(`db/meta_json/a_ondemand.json`, (err) => {});
            fs.writeFile(`db/meta_json/a_ondemand.json`, JSON.stringify(data.filter((obj) => obj.s === 0)), {flag: 'a'}, (err) => {
              if (err) throw err;
            });
          } else {
            logger.debug(`'db/meta_json/a_ondemand.json' file not found`);
            logger.debug(`Creating 'db/meta_json/a_ondemand.json' file ...`);
            fs.writeFile(`db/meta_json/a_ondemand.json`, JSON.stringify(data.filter((obj) => obj.s === 0)), {flag: 'a'}, (err) => {
              if (err) throw err;
            });
          }
        });
      });
    } else {
      logger.error(`'db/meta_json/a.json' file not found`);
    }
  });
}

function outputInternalAsset () {
  logger.debug(`Checking for the existence of 'db/meta_json/a.json' ...`);
  fs.exists(`db/meta_json/a.json`, (exists) => {
    if (exists) {
      logger.debug(`'db/meta_json/a.json' file found`);
      logger.debug(`Loading database json ...`);
      fs.readFile(`db/meta_json/a.json`, 'utf8', function (err, dataRaw) {
        let data = JSON.parse(dataRaw);
        logger.debug(`Checking for the existence of 'db/meta_json/a_internal.json' ...`);
        fs.exists(`db/meta_json/a_internal.json`, (exists) => {
          if (exists) {
            logger.debug(`'db/meta_json/a_internal.json' file found`);
            logger.debug(`Overwriting 'db/meta_json/a_internal.json' file ...`);
            fs.unlink(`db/meta_json/a_internal.json`, (err) => {});
            fs.writeFile(`db/meta_json/a_internal.json`, JSON.stringify(data.filter((obj) => obj.s === 1)), {flag: 'a'}, (err) => {
              if (err) throw err;
            });
          } else {
            logger.debug(`'db/meta_json/a_internal.json' file not found`);
            logger.debug(`Creating 'db/meta_json/a_internal.json' file ...`);
            fs.writeFile(`db/meta_json/a_internal.json`, JSON.stringify(data.filter((obj) => obj.s === 1)), {flag: 'a'}, (err) => {
              if (err) throw err;
            });
          }
        });
      });
    } else {
      logger.error(`'db/meta_json/a.json' file not found`);
    }
  });
}

function copySpecifiedAsset (nameStartsWith) {
  logger.debug(`Checking for the existence of 'db/meta_json/a.json' ...`);
  fs.exists(`db/meta_json/a.json`, (exists) => {
    if (exists) {
      logger.debug(`'db/meta_json/a.json' file found`);
      logger.debug(`Loading database json ...`);
      fs.readFile(`db/meta_json/a.json`, 'utf8', function (err, dataRaw) {
        let database = JSON.parse(dataRaw);
        logger.debug(`Searching required assets ...`);
        let filteredDatabase = database.filter((item) => item.n.startsWith(nameStartsWith));
        filteredDatabase.forEach(obj => {
          let srcPath = path.join(CONFIG.assetInitialPath, 'dat', obj.h.slice(0,2), obj.h);
          let destPath = path.join(CONFIG.assetRenameOutputPath, obj.n);
          fs.mkdir(`${path.dirname(destPath)}`, {recursive: true}, (err) => {
            if (err) throw err;
            logger.debug(`Checking for the existence of '${srcPath}' ...`);
            fs.exists(`${srcPath}`, (exists) => {
              if (exists) {
                logger.debug(`Copying '${obj.n}' ...`);
                fs.copyFile(srcPath, destPath, (err) => {
                  if (err) throw err;
                });
              } else {
                logger.warn(`'${srcPath}' file not found. Skipped`);
                
              }
            });
          });
        });
        console.log(`Total file size = ${formatFileSize(filteredDatabase.map((l) => l.l).reduce((a,b) => a + b))} (${filteredDatabase.map((l) => l.l).reduce((a,b) => a + b)} byte)`);
      });
    } else {
      logger.error(`'db/meta_json/a.json' file not found`);
    }
  });
}

function encodeSoundAssetAwb (nameStartsWith) {
  logger.debug(`Checking for the existence of 'db/meta_json/a.json' ...`);
  let obj_missingFileCount = 0;
  fs.exists(`db/meta_json/a.json`, (exists) => {
    if (exists) {
      logger.debug(`'db/meta_json/a.json' file found`);
      logger.debug(`Loading database json ...`);
      fs.readFile(`db/meta_json/a.json`, 'utf8', function (err, dataRaw) {
        let database = JSON.parse(dataRaw);
        logger.debug(`Searching required assets ...`);
        let filteredDatabase = database.filter((item) => item.n.startsWith(nameStartsWith));
        let filteredDatabase_Acb = filteredDatabase.filter((item) => item.n.endsWith('acb'));
        let filteredDatabase_Awb = filteredDatabase.filter((item) => item.n.endsWith('awb'));
        if (filteredDatabase_Acb.length < filteredDatabase_Awb.length) {
          var filteredDatabaseEntryLengthFlag = 'awb';
          var filteredDatabaseEntryLengthFlag2 = 'acb';
        } else if (filteredDatabase_Awb.length < filteredDatabase_Acb.length) {
          var filteredDatabaseEntryLengthFlag = 'acb';
          var filteredDatabaseEntryLengthFlag2 = 'awb';
        } else {
          var filteredDatabaseEntryLengthFlag = 'awb';
          var filteredDatabaseEntryLengthFlag2 = 'acb';
        }
        filteredDatabase.filter((item) => item.n.endsWith(filteredDatabaseEntryLengthFlag)).forEach(obj => {
          // console.table(obj);
          if (path.extname(obj.n) === '.acb' || path.extname(obj.n) === '.awb') {
            logger.debug(`Checking for the existence of '${path.join(CONFIG.assetRenameOutputPath, obj.n)}' ...`);
            fs.exists(`${path.join(CONFIG.assetRenameOutputPath, obj.n)}`, (exists) => {
              if (exists) {
                logger.debug(`'${path.join(CONFIG.assetRenameOutputPath, obj.n)}' file found`);
                if (filteredDatabaseEntryLengthFlag === 'acb') {
                  if (filteredDatabase_Awb.filter((item) => item.n === obj.n.replace(/\.acb$/, ".awb")).length > 0) {
                    logger.debug(`Checking for the existence of '${path.join(CONFIG.assetRenameOutputPath, obj.n).replace(/\.acb$/, ".awb")}' ...`);
                    // fs.writeFile(`${path.join(CONFIG.assetConvertedOutputPath, path.dirname(obj.n), path.basename(obj.n, path.extname(obj.n)))}.json`, JSON.stringify())
                    fs.exists(`${path.join(CONFIG.assetRenameOutputPath, obj.n).replace(/\.acb$/, ".awb")}`, (exists) => {
                      if (exists) {
                        if (obj_missingFileCount === 0) {
                          logger.debug(`Encoding '${path.join(CONFIG.assetRenameOutputPath, obj.n).replace(/\.acb$/, ".awb")}' file ...`);
                          exec(`bin\\vgmstream.exe -m -i -F -S 0 "${path.join(CONFIG.assetRenameOutputPath, obj.n).replace(/\.acb$/, ".awb")}"`, (err, stdout, stderr) => {
                            let cli_output = parsingVgmstreamInfoToJson(stdout, path.join(CONFIG.assetRenameOutputPath, obj.n).replace(/\.acb$/, ".awb"));
                            fs.mkdir(`${path.join(CONFIG.assetConvertedOutputPath, path.dirname(obj.n), path.basename(obj.n, path.extname(obj.n)))}`, {recursive: true}, (err) => {
                              if (err) throw err;
                              for (let i = 0; i < cli_output.length; i++) {
                                let outputEncodedFileName = `${path.basename(obj.n, path.extname(obj.n))}_${(i + 1).toString().padStart(5, '0')}.wav`;
                                exec(`bin\\vgmstream.exe -o "${path.join(CONFIG.assetConvertedOutputPath, path.dirname(obj.n), path.basename(obj.n, path.extname(obj.n)), outputEncodedFileName)}" -i -F -s ${i + 1} "${path.join(CONFIG.assetRenameOutputPath, obj.n).replace(/\.acb$/, ".awb")}"`, (err, stdout, stderr) => {
                                  if (err) {
                                    console.error(stderr);
                                  }
                                  logger.debug(`${path.join(CONFIG.assetConvertedOutputPath, path.dirname(obj.n), path.basename(obj.n, path.extname(obj.n)), outputEncodedFileName)} encoded`);
                                });
                              }
                              fs.writeFile(`${path.join(CONFIG.assetConvertedOutputPath, path.dirname(obj.n), path.basename(obj.n, path.extname(obj.n)))}.json`, JSON.stringify(cli_output), {flag: 'w'}, (err) => {
                                if (err) throw err;
                                logger.debug(`Metadata writed to '${path.join(CONFIG.assetConvertedOutputPath, path.dirname(obj.n), path.basename(obj.n, path.extname(obj.n)))}.json' file`);
                              });
                            });
                          });
                        }
                      } else {
                        logger.error(`'${path.join(CONFIG.assetRenameOutputPath, obj.n).replace(/\.acb$/, ".awb")}' file not found`);
                        //! curlコマンド出力部
                        if (obj.k >= 10) {
                          console.log(`curl -Lo "${path.join(CONFIG.assetRenameOutputPath, obj.n)}" "${CONFIG.assetUrlBase}/${CONFIG.assetUrlPathCompatible}/${obj.h.slice(0,2)}/${obj.h}"`);
                          console.log(`curl -Lo "${path.join(CONFIG.assetRenameOutputPath, obj.n).replace(/\.acb$/, ".awb")}" "${CONFIG.assetUrlBase}/${CONFIG.assetUrlPathCompatible}/${filteredDatabase_Awb.filter((item) => item.n === obj.n.replace(/\.acb$/, ".awb"))[0].h.slice(0,2)}/${filteredDatabase_Awb.filter((item) => item.n === obj.n.replace(/\.acb$/, ".awb"))[0].h}"`);
                        } else {
                          console.log(`curl -Lo "${path.join(CONFIG.assetRenameOutputPath, obj.n)}" "${CONFIG.assetUrlBase}/${CONFIG.assetUrlPathUnique}/${obj.h.slice(0,2)}/${obj.h}"`);
                          console.log(`curl -Lo "${path.join(CONFIG.assetRenameOutputPath, obj.n).replace(/\.acb$/, ".awb")}" "${CONFIG.assetUrlBase}/${CONFIG.assetUrlPathUnique}/${filteredDatabase_Awb.filter((item) => item.n === obj.n.replace(/\.acb$/, ".awb"))[0].h.slice(0,2)}/${filteredDatabase_Awb.filter((item) => item.n === obj.n.replace(/\.acb$/, ".awb"))[0].h}"`);
                        }
                        obj_missingFileCount += 1;
                      }
                    });
                  } else {
                    // ここにACBをWAVに変換
                    logger.debug(`Checking for the existence of '${path.join(CONFIG.assetRenameOutputPath, obj.n)}' ...`);
                    fs.exists(`${path.join(CONFIG.assetRenameOutputPath, obj.n)}`, (exists) => {
                      if (exists) {
                        if (obj_missingFileCount === 0) {
                          logger.debug(`Encoding '${path.join(CONFIG.assetRenameOutputPath, obj.n)}' file ...`);
                          exec(`bin\\vgmstream.exe -m -i -F -S 0 "${path.join(CONFIG.assetRenameOutputPath, obj.n)}"`, (err, stdout, stderr) => {
                            let cli_output = parsingVgmstreamInfoToJson(stdout, path.join(CONFIG.assetRenameOutputPath, obj.n).replace(/\.acb$/, ".awb"));
                            fs.mkdir(`${path.join(CONFIG.assetConvertedOutputPath, path.dirname(obj.n), path.basename(obj.n, path.extname(obj.n)))}`, {recursive: true}, (err) => {
                              if (err) throw err;
                              for (let i = 0; i < cli_output.length; i++) {
                                let outputEncodedFileName = `${path.basename(obj.n, path.extname(obj.n))}_${(i + 1).toString().padStart(5, '0')}.wav`;
                                exec(`bin\\vgmstream.exe -o "${path.join(CONFIG.assetConvertedOutputPath, path.dirname(obj.n), path.basename(obj.n, path.extname(obj.n)), outputEncodedFileName)}" -i -F -s ${i + 1} "${path.join(CONFIG.assetRenameOutputPath, obj.n)}"`, (err, stdout, stderr) => {
                                  if (err) {
                                    console.error(stderr);
                                  }
                                  logger.debug(`${path.join(CONFIG.assetConvertedOutputPath, path.dirname(obj.n), path.basename(obj.n, path.extname(obj.n)), outputEncodedFileName)} encoded`);
                                });
                              }
                              fs.writeFile(`${path.join(CONFIG.assetConvertedOutputPath, path.dirname(obj.n), path.basename(obj.n, path.extname(obj.n)))}.json`, JSON.stringify(cli_output), {flag: 'w'}, (err) => {
                                if (err) throw err;
                                logger.debug(`Metadata writed to '${path.join(CONFIG.assetConvertedOutputPath, path.dirname(obj.n), path.basename(obj.n, path.extname(obj.n)))}.json' file`);
                              });
                            });
                          });
                        }
                      } else {
                        logger.error(`'${path.join(CONFIG.assetRenameOutputPath, obj.n)}' file not found`);
                        //! curlコマンド出力部
                        if (obj.k >= 10) {
                          console.log(`curl -Lo "${path.join(CONFIG.assetRenameOutputPath, obj.n)}" "${CONFIG.assetUrlBase}/${CONFIG.assetUrlPathCompatible}/${obj.h.slice(0,2)}/${obj.h}"`);
                        } else {
                          console.log(`curl -Lo "${path.join(CONFIG.assetRenameOutputPath, obj.n)}" "${CONFIG.assetUrlBase}/${CONFIG.assetUrlPathUnique}/${obj.h.slice(0,2)}/${obj.h}"`);
                        }
                        obj_missingFileCount += 1;
                      }
                    });
                  }
                } else {
                  if (obj_missingFileCount === 0) {
                    logger.debug(`Encoding '${path.join(CONFIG.assetRenameOutputPath, obj.n)}' file ...`);
                    exec(`bin\\vgmstream.exe -m -i -F -S 0 "${path.join(CONFIG.assetRenameOutputPath, obj.n)}"`, (err, stdout, stderr) => {
                      let cli_output = parsingVgmstreamInfoToJson(stdout, path.join(CONFIG.assetRenameOutputPath, obj.n).replace(/\.acb$/, ".awb"));
                      fs.mkdir(`${path.join(CONFIG.assetConvertedOutputPath, path.dirname(obj.n), path.basename(obj.n, path.extname(obj.n)))}`, {recursive: true}, (err) => {
                        if (err) throw err;
                        for (let i = 0; i < cli_output.length; i++) {
                          let outputEncodedFileName = `${path.basename(obj.n, path.extname(obj.n))}_${(i + 1).toString().padStart(5, '0')}.wav`;
                          exec(`bin\\vgmstream.exe -o "${path.join(CONFIG.assetConvertedOutputPath, path.dirname(obj.n), path.basename(obj.n, path.extname(obj.n)), outputEncodedFileName)}" -i -F -s ${i + 1} "${path.join(CONFIG.assetRenameOutputPath, obj.n)}"`, (err, stdout, stderr) => {
                            if (err) {
                              console.error(stderr);
                            }
                            logger.debug(`${path.join(CONFIG.assetConvertedOutputPath, path.dirname(obj.n), path.basename(obj.n, path.extname(obj.n)), outputEncodedFileName)} encoded`);
                          });
                        }
                        fs.writeFile(`${path.join(CONFIG.assetConvertedOutputPath, path.dirname(obj.n), path.basename(obj.n, path.extname(obj.n)))}.json`, JSON.stringify(cli_output), {flag: 'w'}, (err) => {
                          if (err) throw err;
                          logger.debug(`Metadata writed to '${path.join(CONFIG.assetConvertedOutputPath, path.dirname(obj.n), path.basename(obj.n, path.extname(obj.n)))}.json' file`);
                        });
                      });
                    });
                  }
                }
              } else {
                logger.error(`'${path.join(CONFIG.assetRenameOutputPath, obj.n)}' file not found`);
                //! curlコマンド出力部
                if (obj.k >= 10) {
                  console.log(`curl -Lo "${path.join(CONFIG.assetRenameOutputPath, obj.n).replace(/\.awb$/, ".acb")}" "${CONFIG.assetUrlBase}/${CONFIG.assetUrlPathCompatible}/${filteredDatabase_Acb.filter((item) => item.n === obj.n.replace(/\.awb$/, ".acb"))[0].h.slice(0,2)}/${filteredDatabase_Acb.filter((item) => item.n === obj.n.replace(/\.awb$/, ".acb"))[0].h}"`);
                  console.log(`curl -Lo "${path.join(CONFIG.assetRenameOutputPath, obj.n)}" "${CONFIG.assetUrlBase}/${CONFIG.assetUrlPathCompatible}/${obj.h.slice(0,2)}/${obj.h}"`);
                } else {
                  console.log(`curl -Lo "${path.join(CONFIG.assetRenameOutputPath, obj.n).replace(/\.awb$/, ".acb")}" "${CONFIG.assetUrlBase}/${CONFIG.assetUrlPathUnique}/${filteredDatabase_Acb.filter((item) => item.n === obj.n.replace(/\.awb$/, ".acb"))[0].h.slice(0,2)}/${filteredDatabase_Acb.filter((item) => item.n === obj.n.replace(/\.awb$/, ".acb"))[0].h}"`);
                  console.log(`curl -Lo "${path.join(CONFIG.assetRenameOutputPath, obj.n)}" "${CONFIG.assetUrlBase}/${CONFIG.assetUrlPathUnique}/${obj.h.slice(0,2)}/${obj.h}"`);
                }
                obj_missingFileCount += 1;
              }
            });
          } else {
            logger.warn(`Specified file is not awb/acb file. skipped`);
          }
        });
        console.log(filteredDatabase_Acb.length);
        console.log(filteredDatabase_Awb.length);
        console.log(filteredDatabaseEntryLengthFlag);
      });
    } else {
      logger.error(`'db/meta_json/a.json' file not found`);
    }
  });
}

function convertWavToFlacRecursive(dirPath) {
  let files = fs.readdirSync(dirPath);
  files.forEach((file) => {
    let filePath = path.join(dirPath, file);
    let stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      convertWavToFlacRecursive(filePath);
    } else if (stats.isFile() && path.extname(filePath) === '.wav') {
      let flacFilePath = filePath.replace('.wav', '.flac');
      let flacProcess = spawn('bin\\flac.exe', ['-f', '--delete-input-file', '-V', '-l', '12', '-b', '4608', '-m', '-r', '8', '-A', 'subdivide_tukey(5)', '-o', flacFilePath, filePath]);
      flacProcess.on('exit', (code) => {
        logger.debug(`flac.exe exited with code ${code}`);
      });
    }
  });
}

function showCriAudioMetadata (filepath) {
  logger.debug(`Checking for the existence of '${path.join(filepath)}' ...`);
  fs.exists(`${path.join(filepath)}`, (exists) => {
    if (exists) {
      logger.debug(`Reading metadata from '${path.join(filepath)}' ...`);
      exec(`bin\\vgmstream.exe -m -i -F -S 0 "${path.join(filepath)}"`, (err, stdout, stderr) => {
        let parsedMetadataJson = parsingVgmstreamInfoToJson(stdout, path.join(filepath));
        logger.debug(`Metadata loaded`);
        console.log(parsedMetadataJson);
      });
    } else {
      logger.error(`'${path.join(filepath)}' file not found`);
    }
  });
}

function showErrorMsg (id) {
  const errorMsgList = {
    '0001': 'Invalid command',
    '0002': 'Invalid argument'
  };
  logger.error(`Error: ${errorMsgList[id]}`);
}

// ========== Argument processing ==========

if (arg.length === 0) {
  showHelpMsg();
} else {
  if (arg[0] === 'help') {
    showHelpMsg();
  } else if (arg[0] === 'saveDatabaseTableToJsonFile') {
    if (arg.length === 1) {
      showErrorMsg('0002');
    } else {
      saveDatabaseTableToJsonFile(arg[1]);
    }
  } else if (arg[0] === 'copySpecifiedAsset') {
    if (arg.length === 1) {
      showErrorMsg('0002');
    } else {
      copySpecifiedAsset(arg[1]);
    }
  } else if (arg[0] === 'encodeSoundAssetAwb') {
    if (arg.length === 1) {
      showErrorMsg('0002');
    } else {
      encodeSoundAssetAwb(arg[1]);
    }
  } else if (arg[0] === 'convertWavToFlacRecursive') {
    if (arg.length === 1) {
      showErrorMsg('0002');
    } else {
      convertWavToFlacRecursive(arg[1]);
    }
  } else if (arg[0] === 'showCriAudioMetadata') {
    if (arg.length === 1) {
      showErrorMsg('0002');
    } else {
      showCriAudioMetadata(arg[1]);
    }
  } else if (arg[0] === 'saveAllDatabaseTableToJsonFile') {
    saveAllDatabaseTableToJsonFile();
  } else if (arg[0] === 'saveAllMasterDatabaseTableToJsonFile') {
    saveAllMasterDatabaseTableToJsonFile();
  } else if (arg[0] === 'showTableListOfDatabase') {
    showTableListOfDatabase();
  } else if (arg[0] === 'showTableListOfMasterDatabase') {
    showTableListOfMasterDatabase();
  } else if (arg[0] === 'outputOndemandAsset') {
    outputOndemandAsset();
  } else if (arg[0] === 'outputInternalAsset') {
    outputInternalAsset();
  } else {
    showErrorMsg('0001');
  }
}