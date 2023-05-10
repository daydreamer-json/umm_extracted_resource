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
const request = require('request');
logger.debug('Loaded module: request');
const sqlite3 = require("sqlite3");
logger.debug('Loaded module: sqlite3');
const db = new sqlite3.Database('db/meta');
const master_db = new sqlite3.Database('db/master/master.mdb');
logger.debug('SQLite database has been initialized');

const CONFIG = {
  'assetInitialPath': 'D:\\Games\\Umamusume\\Cygames\\umamusume',
  'assetUrlBase': 'https://prd-storage-umamusume.akamaized.net/dl/resources/Windows/assetbundles',
  'assetRenameOutputPath': 'assets/'
};

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
    'outputInternalAsset'
  ];
  console.log(`\nUsage: node ${path.basename(process.argv[1])} COMMAND [VALUE]\n\nCommands:\n  ${commandList.join('\n  ')}\n\nsaveDatabaseTableToJsonFile:\n  value: tableName`);
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