const cors = require('cors');
const express = require('express');
const fetch = require('node-fetch');
const NLPCloudClient = require('nlpcloud');
const path = require('path')

const PORT = process.env.PORT || 3001;

const NLPCLOUD_API_KEY = -1;
const client = new NLPCloudClient('bart-large-cnn', NLPCLOUD_API_KEY);

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api', (req, res) => {
  res.json({ message: 'Hi from /api' });
});

app.post('/bart', (req, res) => {

  console.log('bart with pre-init client called');
  const text = req.body.text;

  client.summarization(text)
    .then(r => { console.log("bart r ", r); res.json(r.data) })
    .catch(err => { console.log("bart err ", err); res.json({ err }) });

});

app.post('/tldr', (req, res) => {

  const data = req.body;

  fetch("https://scitldr.apps.allenai.org/api/solve", {
    "headers": {
      "accept": "application/json, text/plain, */*",
      "accept-language": "en-US,en;q=0.9",
      "content-type": "application/json;charset=UTF-8",
      "sec-ch-ua": "\"Google Chrome\";v=\"89\", \"Chromium\";v=\"89\", \";Not A Brand\";v=\"99\"",
      "sec-ch-ua-mobile": "?0",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "cookie": "_oauth2_proxy_ai2_csrf=4fcd8638ae5002c58dfb244e231d3b40"
    },
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": JSON.stringify(data),
    "method": "POST",
    "mode": "cors"
  }).then(r => r.json())
    .then(j => { console.log("tldr json ", j); res.json({ answer: j['answer'] }) })
    .catch(err => { console.log("tldr err ", err); res.json({ err }) });

});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
