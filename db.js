const mysql = require('mysql2/promise');
module.exports = async () => {
  let db;
  try{db=await mysql.createPool({
    host: 'db4free.net',
    user: 'nacl_eco',
    password: process.env.DB_PWD,
    database: 'nacl_eco',
  });}catch(err){console.log('Error@createPool!!!!\n', err);}
  console.log('Connected to DB');
  db.on('error', err =>
  {
    console.log('db.onError!!!!', err);
  });
  return db;
};
