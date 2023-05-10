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
  'assetUrlBase': 'https://prd-storage-umamusume.akamaized.net/dl/resources/Windows/assetbundles'
};

fs.readFile(`db/meta_json/a_ondemand.json`, 'utf8', function (err, dataRaw) {
  const data = JSON.parse(dataRaw);
  console.log(data.map((l) => l.n).filter((item) => item.startsWith('sound/b')));
});