'use strict';

const line = require('@line/bot-sdk');
const express = require('express');

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

// event handler
function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    // ignore non-text-message event
    return Promise.resolve(null);
  }
  const {text:msg} = event.message;
  var text
  if (msg.[0] == '\\' ) {
    //method
    if (msg.substring(1,5) == 'exp(') {
      var exp = msg.substring(5,msg.length-1).split(",")
      text = String(exp[0]+":"+exp[1])
    }
  }
  // create a echoing text message
  //const echo = { type: 'text', text: event.message.text };
  else {
    text = `Hello, you sent a message with length=${msg.length}`;
  }
  // use reply API
  return client.replyMessage(event.replyToken, {type:'text', text});
}

// listen on port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});
