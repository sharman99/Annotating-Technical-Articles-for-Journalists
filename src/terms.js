import nlp from 'compromise';
import rake from 'rake-js';
const keywordExtractor = require("keyword-extractor");
const natural = require('natural')
const craftData = require('./craft.json'); // tf-idf corpus (academic articles)

// RETEXT
const vfile = require('to-vfile');
const retext = require('retext');
const pos = require('retext-pos');
const keywords = require('retext-keywords');
const toString = require('nlcst-to-string');
const RETEXT_MAX = 20;

export function identifyTerms(text, callback) {

  // Run term-extraction algorithms
  const naturalTerms = doNatural(text, craftData.documents);
  const compromiseTerms = doCompromise(text); 
  const rakeTerms = doRake(text); 
  const keywordExtractorTerms = doKeywordExtractor(text);

  function retextDone(retextKeytermsTerms, retextKeyphrasesTerms) {

    const allKeyterms = {
      naturalTerms,
      compromiseTerms,
      rakeTerms,
      keywordExtractorTerms,
      retextKeytermsTerms,
      retextKeyphrasesTerms,
    };

    callback(allKeyterms);

  };
  doRetext(text, RETEXT_MAX, retextDone);

};

function doNatural(text, corpus) { 

  const tfidf = new natural.TfIdf();
  tfidf.addDocument(text);

  for (const doc of corpus) {
    tfidf.addDocument(doc);
  };

  const tfidfTerms = tfidf.listTerms(0).map(termData => termData.term);
  return tfidfTerms;
  
};

function doCompromise(text) {

  const topics = nlp(text).topics();
  return topics.out("array");

};

function doRetext(text, max, callback) {

  retext()
    .use(pos) // Must use pos before keyworsd
    .use(keywords, {maximum: max})
    .process(text, (err, file) => {

      const keywords = file.data.keywords.map(kw => toString(kw.matches[0].node));
      const keyphrases = file.data.keyphrases.map(kp => kp.matches[0].nodes.map(toString).join(""));
      callback(keywords, keyphrases);

    });

};

function doRake(text) { 
  return rake(text, { "langauge" : "english" });
}

function doKeywordExtractor(text) { 
  return keywordExtractor.extract(text, { "language" : "english", "remove_duplicates" : true });
};
