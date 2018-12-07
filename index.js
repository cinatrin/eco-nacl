'use strict';
const mysql = require('./db.js');
const line = require('@line/bot-sdk');
const express = require('express');
let db;

const cmdpfx='@@', cmdpfxlen=cmdpfx.length;
const cmdsfx='@@', cmdsfxlen=cmdsfx.length;
const helpMsg = [
  '@@help',
  '@@lv <lvtype> <exp>',
].join('\n');

// create LINE SDK config from env variables
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

// create LINE SDK client
const client = new line.Client(config);

// create Express app
// about Express itself: https://expressjs.com/
const app = express();

// register a webhook handler with middleware
// about the middleware, please refer to doc
app.post('/callback', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});
const {DEBUG} = process.env;
if(DEBUG)
{
  const bodyParser = require('body-parser')
  // parse application/x-www-form-urlencoded
  app.use(bodyParser.urlencoded({ extended: false }))
  // parse application/json
  app.use(bodyParser.json())
  //DEBUG
  app.post('/DEBUG', async (req, res) => {
    try{
      const result = await handleEvent(req.body);
      res.json(result);
    }
    catch(err){
      console.error(err);
      res.status(500).end();
    };
  });
}

// event handler
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    // ignore non-text-message event
    return Promise.resolve(null);
  }
  const {text:msg} = event.message;
  var text, ptr;
  if(msg.startsWith(cmdpfx))
  {
    const [cmd, ...paras] = msg.substring(cmdpfxlen).trim().split(/\s+/);
    text = await (async()=>{switch(cmd)
    {
      case '': return '@@';
      case 'lv':
        if(paras.length<2) return;
        const [lvtype, exp] = paras;
        try{
          const [[o]] = await db.query(`
            SELECT lv+LEAST(FLOOR((?-cexp)/nexp*1e3)/1e3,0.999) lvf
            FROM experience WHERE lvtype=? AND ?>=cexp
            ORDER BY lv DESC LIMIT 1`,
            [exp, lvtype, exp]);
          return o? o.lvf.toFixed(3): 'Invalid parameters!!!!';
        }catch(err){return 'Error@query!!!!\n'+err}
      case 'help': return helpMsg;
    }})() || helpMsg;
  }
  else if(msg.endsWith(cmdsfx))
  {
    const s = msg.substring(0, msg.length-cmdsfxlen).trim();
    const [results] = await db.query(`SELECT reply, weight FROM random_reply
      WHERE input=?`, [s]);
    const sW=results.reduce((s,a)=>s+a.weight,0);
    if(sW===0) return Promise.resolve(null);
    text = (()=>{
      const seed = sW*Math.random();
      let cV = 0;
      for(const {reply, weight} of results)
      {
        cV += weight;
        if(cV>seed) return reply;
      }
    })();
  }
  else if (msg[0] == '\\' ) {
    //method
    if (msg.substring(1,5) == 'exp(') {
      var exp = msg.substring(5,msg.length-1).split(",");
      text = String(exp[0]+":"+exp[1]);
    }
  }
  // create a echoing text message
  //const echo = { type: 'text', text: event.message.text };
  else {
    text = `Hello, you sent a message with length=${msg.length}`;
  }
  // use reply API
  return DEBUG? {type:'text', text}:
    client.replyMessage(event.replyToken, {type:'text', text});
}

// listen on port
const port = process.env.PORT || 3000;
(async()=>{
db = await mysql();
app.listen(port, () => {
  console.log(`listening on ${port}`);
});})();
