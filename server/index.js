const cors = require('cors');
const busboy = require('connect-busboy');
const express = require('express');
const NLPCloudClient = require('nlpcloud');
const path = require('path')

var fetch = require('node-fetch');
var FormData = require('form-data');

const PORT = 3001; // process.env.PORT || 3001;

const app = express();

app.use(busboy()); 
app.use(cors());
app.use(express.json());

app.get('/api', (req, res) => {
  res.json({ message: 'Hi from /api' });
});

app.post('/bart', (req, res) => {

  const text = req.body.text;
  const NLPCLOUD_API_KEY = '4d47dda23cf7bc539461418bf02e27cd800a0577';
  const client = new NLPCloudClient('bart-large-cnn', NLPCLOUD_API_KEY);

  client.summarization(text)
    .then(function(r) {
      res.json(r.data);
    }).catch(function(err) {
      res.json(err);
    });

});

app.post('/pd', (req, res) => {

  const API_KEY = 'Ds4BRd3GkrA5Uby8';
  const url = 'http://www.paper-digest.com/pdf';
  const nSentences = 3; 

  const parseResult = result => {
    const { metadata, summary } = result;
    for (var section in summary) {
      summary[section] = summary[section].map(s => s.sentence).join(" ");
    }
    return {
      metadata,
      summaries: summary,
    }
  };

  req.pipe(req.busboy);
  req.busboy.on('file', (fieldname, file, filename) => {
    console.log('Got file with name ', filename);

    /*var requestOptions = {
      method: 'GET',
      redirect: 'follow'
    };

    fetch("http://www.paper-digest-ai.com/v3/?key=" + API_KEY + "&article_id=10.1371/journal.pone.0178126", requestOptions)
      .then(response => response.text())
      .then(result => console.log(result))
      .catch(error => console.log('error', error));*/

    let headers = new fetch.Headers();
    headers.append("key", API_KEY);

    let body = new FormData();
    body.append("pdf-input", file, filename);
    body.append("ns", nSentences);

    const requestOptions = {
      body,
      headers,
      method: "POST",
      redirect: "follow",
    };

    fetch(url, requestOptions)
      .then(response => { console.log(response); return response.text() })
      .then(r => console.log(r))
      .then(result => {

        const parsedResult = parseResult(result);
        console.log("PD final: ", parsedResult);
        res.json(parsedResult);

      }).catch(err => {

        console.log("server PD err: ", err);

      });
  });

});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
