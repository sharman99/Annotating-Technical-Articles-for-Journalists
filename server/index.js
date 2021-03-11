const express = require("express");
const NLPCloudClient = require('nlpcloud');
const path = require('path')

const PORT = 3001; // process.env.PORT || 3001;

const app = express();

app.get("/api", (req, res) => {
  res.json({ message: "Hi from server" });
});

/*app.get('*', (req, res) => {
  console.log('get *');
  res.sendFile(path.resolve(__dirname, '../public', 'index.html'));
});*/

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
