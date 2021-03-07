import { JsTeaser } from './jsteaser';
const lexrank = require('lexrank.js');
const unirest = require('unirest');
const request = require('request');
const SummarizerManager = require('node-summarizer').SummarizerManager;
const tr = require('textrank');
const sum = require('sum');
const NLPCloudClient = require('nlpcloud');


const N_SENTENCES = 3;
const EMPTY_TEXT = "No summary available for this section. Please try another section.";

// TODO: Use article title (e.g., with jsteaser) for better results?a
export function summarize({ selectedSummarizer, ...args }) {

  ({

    /*"Vectorspace": doVectorspace,*/
    "Bart": doBart,
    "Text Monkey": doTextMonkey,
    "Paper Digest" : doPaperDigest,
    "JS Teaser" : doJsTeaser,
    "Sum" : doSum,
    "LexRank" : doLexRank,

  })[selectedSummarizer](args);

};

function doBart({ selectedSection, sectionTexts, callback }) {

  const apiKey = "4d47dda23cf7bc539461418bf02e27cd800a0577";
  const client = new NLPCloudClient('en_core_web_lg', apiKey); //'4eC39HqLyjWDarjtT1zdp7dc')

  // Returns an Axios promise with the results.
  // In case of success, results are contained in `response.data`. 
  // In case of failure, you can retrieve the status code in `err.response.status` 
  // and the error message in `err.response.data.detail`.
  client.entities("John Doe is a Go Developer at Google")
    .then(function (response) {
      console.log(response.data);
    })
    .catch(function (err) {
      console.log(err);
      console.error(err.response.status);
      console.error(err.response.data.detail);
    });

  /*const rawText = sectionTexts.find(s => s['name'] === selectedSection).text;
  const WORD_LIMIT = 100;
  const text = rawText.split(" ").slice(1, WORD_LIMIT).join(" ");

  const apiKey = "4d47dda23cf7bc539461418bf02e27cd800a0577";
  const client = new NLPCloudClient("bart-large-cnn", apiKey);

  client.summarization(text)
    .then(response => {
      console.log("bart response ", response);
    }).catch(err => {
      console.log("bart err ", err);
    });*/
  

}

function doVectorspace({ selectedSection, sectionTexts, callback }) {

  const text = sectionTexts.find(s => s['name'] === selectedSection).text;
  const options = {
    method: 'GET',
    url: 'https://vectorspaceai-vectorspace-ai-summarizer-v1.p.rapidapi.com/recommend/app/summarize',
    qs: {query: 'text', vxv_token_addr: '0xC2A568489BF6AAC5907fa69f8FD4A9c04323081D'},
    headers: {
      'x-rapidapi-key': 'c0e038c6dcmsh8e1cc6a5a5144c8p18b556jsndd49f7573f1a',
      'x-rapidapi-host': 'vectorspaceai-vectorspace-ai-summarizer-v1.p.rapidapi.com',
      useQueryString: true
    }
  };

  request(options, function (error, response, body) {
    if (error) throw new Error(error);
    console.log("body ", body);
  });

}

function doTextMonkey({ selectedSection, sectionTexts, title, callback }) {

  const text = sectionTexts.find(s => s['name'] === selectedSection).text;

  const options = {
    method: 'POST',
    url: 'https://text-monkey-summarizer.p.rapidapi.com/nlp/summarize',
    headers: {
      'content-type': 'application/json',
      'x-rapidapi-key': 'c0e038c6dcmsh8e1cc6a5a5144c8p18b556jsndd49f7573f1a',
      'x-rapidapi-host': 'text-monkey-summarizer.p.rapidapi.com',
      useQueryString: true
    },
    body: {
      text,
    },
    json: true
  };

  request(options, (error, response, body) => {
    callback(body.summary);
  });

}

function doPaperDigest({ selectedSection, getPD, file, callback }) {

  getPD(file, N_SENTENCES)
    .then(results => {
      console.log("paper digest for ", selectedSection, " done, ", results);
      const summary = { [selectedSection]: EMPTY_TEXT, ...results.summaries }[selectedSection];
      callback(summary);
    });

}

function doSum({ selectedSection, sectionTexts, callback }) {

  const text = sectionTexts.find(s => s['name'] === selectedSection).text;
  const summary = sum({ "corpus" : text, 'nSentences' : N_SENTENCES });
  callback(summary.summary);

}

function doJsTeaser({ selectedSection, sectionTexts, title, callback }) {

  const text = sectionTexts.find(s => s['name'] === selectedSection).text;
  const data = {
    title: title || "Title", // crashes if empty
    text, 
  };

  const jsTeaser = new JsTeaser(data);
  callback(jsTeaser.summarize().join(" "));

}

function doTextRank({ selectedSection, sectionTexts, callback }) {

  const text = sectionTexts.find(s => s['name'] === selectedSection).text;
  const textRank = new tr.TextRank(text);
  callback(textRank.summarizedArticle);

}

function doNodeSummarizer({ selectedSection, sectionTexts, callback }) {

  const text = sectionTexts.find(s => s['name'] === selectedSection).text;

  // Hits error with text rank summary
  const Summarizer = new SummarizerManager(text, N_SENTENCES);
  const freqSummary = Summarizer.getSummaryByFrequency().summary;
  const textRankSummary = Summarizer.getSummaryByRank().then((summaryObj) => {
    callback(freqSummary, summaryObj.summary);
  });

}

function doLexRank({ selectedSection, sectionTexts, callback }) {

  const text = sectionTexts.find(s => s['name'] === selectedSection).text;
  lexrank(text, (err, result) => {
    const weightedSentences = result[0];

    // Take top N_SENTENCES sentneces with top "average" weight
    const weights = weightedSentences.map(wS => wS.weight.average);
    const weightCutoff = weights.sort((a, b) => b - a)[N_SENTENCES - 1];
    const sentences = weightedSentences.filter(wS => wS.weight.average >= weightCutoff).map(wS => wS.text);
    const summary = sentences.join(" ");

    callback(summary);
  });

}
