import nlp from 'compromise';

// RETEXT
var vfile = require('to-vfile');
var retext = require('retext');
var pos = require('retext-pos');
var keywords = require('retext-keywords');
var toString = require('nlcst-to-string');

// NATURAL
var natural = require('natural');

const fs = require('fs');

// How many keywords, phrases should retext look for? 
const RETEXT_MAX = 20;

export function identifyTerms(text) {
  console.log("identifyTerms text ", text);

  // NATURAL: TF-IDF
  doNatural(text);

  // COMPROMISE
  const topics = nlp(text).topics();
  const topicsArray = topics.out("array");
  console.log("topics arary ", topicsArray);
  
  // RETEXT
  retext()
    .use(pos) // Must use pos before keyworsd
    .use(keywords, {maximum: RETEXT_MAX})
    .process(text, retextDone);

};

function doNatural(text) { 

  //const corpusDir = "../data/craft-articles-txt";
  /*fs.readdir(corpusDir, (err, files) => {
    files.forEach(file => {
      console.log(file);
    });
  });*/

  const corpusIndex = "../data/craft-pmids-release";
  

};

function retextDone(err, file) {

  const keywords = file.data.keywords.map(kw => toString(kw.matches[0].node));
  console.log("keywords: ", keywords);

  const keyphrases = file.data.keyphrases.map(kp => kp.matches[0].nodes.map(toString).join(""));
  console.log("keyphrases: ", keyphrases);

};
