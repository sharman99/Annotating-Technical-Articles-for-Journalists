import { JsTeaser } from './jsteaser';
const lexrank = require('lexrank.js');
const SummarizerManager = require('node-summarizer').SummarizerManager;
const tr = require('textrank');
const sum = require('sum');

const N_SENTENCES = 3;
const EMPTY_TEXT = "No summary available for this section. Please try another section.";

// TODO: Use article title (e.g., with jsteaser) for better results?a
export function summarize({ selectedSummarizer, ...args }) {

  ({

    "Paper Digest" : doPaperDigest,
    "JS Teaser" : doJsTeaser,
    "Sum" : doSum,
    "LexRank" : doLexRank,

  })[selectedSummarizer](args);

};

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

function doJsTeaser({ selectedSection, sectionTexts, callback }) {

  const text = sectionTexts.find(s => s['name'] === selectedSection).text;
  const data = {
    title: "Title", // crashes if title is "" or " "
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
