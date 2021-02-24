import { JsTeaser } from './jsteaser';
const lexrank = require('lexrank.js');
const SummarizerManager = require('node-summarizer').SummarizerManager;
const tr = require('textrank');
const sum = require('sum');

const N_SENTENCES = 3;

// TODO: Use article title (e.g., with jsteaser) for better results?
export function summarize(text, callback) {

  // Run summarization algorithms
  const textRankSummary = ""; //doTextRank(text);
  const jsTeaserSummary = doJsTeaser(text);
  const sumSummary = doSum(text); 

  function lexrankDone(lexrankSummary) { 

    const allSummaries = {
      textRankSummary,
      jsTeaserSummary,
      sumSummary,
      lexrankSummary,
    };

    callback(allSummaries);

  };
  doLexrank(text, lexrankDone);

};

function doSum(text) {

  const summary = sum({ "corpus" : text, 'nSentences' : N_SENTENCES });
  return summary.summary;

};

function doJsTeaser(text) { 

  const data = {
    title: "Title", // crashes if title is "" or " "
    text, 
  };

  const jsTeaser = new JsTeaser(data);
  return jsTeaser.summarize().join(" ");

};

function doTextRank(text, callback) {

  const textRank = new tr.TextRank(text);
  return textRank.summarizedArticle;

};

function doNodeSummarizer(text, callback) {

  // Hits error with text rank summary
  const Summarizer = new SummarizerManager(text, N_SENTENCES);
  const freqSummary = Summarizer.getSummaryByFrequency().summary;
  const textRankSummary = Summarizer.getSummaryByRank().then((summaryObj) => {
    callback(freqSummary, summaryObj.summary);
  });

};

function doLexrank(text, callback) {

  lexrank(text, (err, result) => {

    const weightedSentences = result[0]; 

    // Take top N_SENTENCES sentneces with top "average" weight
    const weights = weightedSentences.map(wS => wS.weight.average);
    const weightCutoff = weights.sort((a, b) => b - a)[N_SENTENCES - 1];
    const sentences = weightedSentences.filter(wS => wS.weight.average >= weightCutoff).map(wS => wS.text);
    const summary = sentences.join(" ");
    
    callback(summary); 

  });

};
