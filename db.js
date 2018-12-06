const mysql = require('mysql2/promise');
module.exports = async () => {
  let db;
  const {DB_HOST, DB_USERNAME, DB_PASSWORD, DB_DATABASE} = process.env;
  try{db=await mysql.createPool({
    host: DB_HOST,
    user: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_DATABASE,
  });}catch(err){console.log('Error@createPool!!!!\n', err);}
  db.on('connect', ()=>{console.log('Connected to DB');});
  db.on('error', err=>{console.log('db.onError!!!!', err);});
  return db;
};
