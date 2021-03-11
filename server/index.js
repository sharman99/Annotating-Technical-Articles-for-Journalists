const cors = require('cors');
const express = require('express');
const NLPCloudClient = require('nlpcloud');
const path = require('path')

const PORT = 3001; // process.env.PORT || 3001;

const app = express();

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

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
