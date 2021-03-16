import { JsTeaser } from './jsteaser';
import * as constants from './constants';

const lexrank = require('lexrank.js');
const unirest = require('unirest');
const request = require('request');
const SummarizerManager = require('node-summarizer').SummarizerManager;
const tr = require('textrank');
const sum = require('sum');

const N_SENTENCES = 3;
const EMPTY_TEXT = "No summary available for this section. Please try another section.";
const SERVER = 'http://agile-journey-26810.herokuapp.com';

export function summarize({ selectedSummarizer, ...args }) {

  console.log("summarize() called with summarizer ", selectedSummarizer, "  args ", args);

  ({

    "Bart": doBart,
    "Text Monkey": doTextMonkey,
    "Paper Digest" : doPaperDigest,
    "JS Teaser" : doJsTeaser,
    "Sum" : doSum,
    "LexRank" : doLexRank,
    "SciTLDR": doSciTLDR,
    "TextRank": doTextRank,

  })[selectedSummarizer](args);

};

function doSciTLDR({ sectionTexts, callback }) {

  // If have abstract, use that; else use whole thing
  const abs = sectionTexts.find(s => s.name === "Abstract");
  const intro = sectionTexts.find(s => s.name === "Introduction");
  const res = sectionTexts.find(s => s.name === "Results");

  let data = [];
  if (abs) { 
    console.log("for scitldr, using abstract");
    data = {
      "question": abs.text,
      "choices": [
        (intro || {text: ""}).text,
        (res || { text: "" }).text,
      ]
    };
  } else {
    console.log("for scitldr, using all");
    data = {
      "question": sectionTexts.find(s => s.name === "All").text,
      "choices": [ "", "" ],
    };
  }

  const headers = { 'Content-Type': 'application/json' };

  fetch(SERVER + '/tldr', { headers, body: JSON.stringify(data), method: 'POST' })
    .then((res) => res.json())
    .then((data) => { console.log("backend data ", data); callback(data['answer'] || constants.ERROR_TEXT) });

}

function doBart({ callback, getBart, selectedSection }) {

  getBart(selectedSection)
    .then(callback)

}

function doTextMonkey({ selectedSection, sectionTexts, title, callback }) {

  console.log("doAylien");

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
