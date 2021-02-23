import 'react-pdf/dist/umd/Page/AnnotationLayer.css';
import React, { useCallback,  useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@material-ui/core';
import { render } from '@testing-library/react';
import ResearcherInfo from './ResearcherInfo';
import Summary from './Summary';
import { identifyTerms } from './terms';
import { summarize } from './summarize';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function PDFViewer() {

  // *** PDF DISPLAY ***
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [file, setFile] = React.useState("");
  const hiddenFileInput = React.useRef(null);
  const [sectionTexts, setSectionTexts] = useState([]);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  function changePage(offset) {
    setPageNumber(prevPageNumber => prevPageNumber + offset);
  }

  function previousPage() {
    changePage(-1);
  }

  function nextPage() {
    changePage(1);
  }

  function removeTextLayerOffset() {
    const textLayers = document.querySelectorAll(".react-pdf__Page__textContent");
      textLayers.forEach(layer => {
        const { style } = layer;
        style.top = "0";
        style.left = "0";
        style.transform = "";
    });
  }

  const handleClick = event => {
    hiddenFileInput.current.click();
  }

  function handleUpload(event) {
    const uploadedFile = event.target.files[0];
    setFile(uploadedFile);
    extractText(uploadedFile, (text) => {

      const sectionTexts = splitBySection(text);
      setSectionTexts(sectionTexts);
      identifyTerms(text, onTermIdentification);

    });
  }

  function splitBySection(text) {

    const sectionHeaders = ["Abstract", "Introduction", "Results", "Methods", "Discussion", "Conclusion", "Conclusions", "References", "Funding"];

    let currentSectionWords = [];
    let currentSectionName = "";
    let sectionTexts = [{ "name" : "All", "text" : text }];

    for (const word of text.split(" ")) {

      if (word.length === 0) {
        continue;
      }

      const titleCaseWord = word[0].toUpperCase() + word.substr(1).toLowerCase();
      if (sectionHeaders.includes(word) || sectionHeaders.includes(titleCaseWord)) { // new section starts

        if (currentSectionName) {
          // if currentSctionName empty, we're not in a section yet, ignore that text
          sectionTexts.push({ "name" : currentSectionName, "text" : currentSectionWords.join(" ") });
        }

        currentSectionName = sectionHeaders.find(sH => sH === word) || sectionHeaders.find(sH => sH === titleCaseWord);
        currentSectionWords = [];

      } else { // current section continues

        currentSectionWords.push(word);

      }

    }

    sectionTexts.push({ "name" : currentSectionName, "text" : currentSectionWords.join(" ") });
    console.log("sectionTexts ", sectionTexts);

    return sectionTexts;

  }

  function extractText(uploadedFile, callback) {

    const fileReader = new FileReader();
    fileReader.onload = function() {

        const typedArray = new Uint8Array(this.result);
        pdfjs.getDocument(typedArray).promise.then(function(pdf) {

            // https://stackoverflow.com/a/40662025/2809263
            const pageTextPromises = [];
            for (var j = 1; j <= pdf.numPages; j++) {

              pageTextPromises.push(pdf.getPage(j).then(function(page) {
                return page.getTextContent().then(function(textContent) {
                  return textContent.items.map(item => item.str).join(" ");
                });
              }));

            }

            Promise.all(pageTextPromises).then(function(pageTexts) {
              callback(pageTexts.join(" "));
            });

        });
    };

    fileReader.readAsArrayBuffer(uploadedFile);

  }

  // *** HIGHLIGHTING ***
  const [textItems, setTextItems] = useState();
  const [stringsToHighlight, setStringsToHighlight] = useState([]);
  var matchedPatterns = [];

  function onTermIdentification(allKeyterms) {
    setStringsToHighlight(allKeyterms.retextKeyphrasesTerms);
  }

  // Highlight recipe: github.com/wojtekmaj/react-pdf/wiki/Recipes#highlight-text-on-the-page
  function highlightPattern(text, toHighlight, left=[], right=[]) {

    function escapeForRegex(s) { // https://stackoverflow.com/a/6969486/2809263
      return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // TODO: require left patterns to be on left, right on right
    const patterns = [...toHighlight, ...left, ...right];
    const unmatchedPatterns = patterns.filter(p => !matchedPatterns.includes(p));
    const allPatterns = new RegExp(unmatchedPatterns.map(escapeForRegex).join('|'), 'gi');

    const splitText = text.split(allPatterns);
    if (splitText.length <= 1) {
      return text;
    }

    const matches = text.match(allPatterns);
    matchedPatterns = [...matchedPatterns, ...matches]; 

    return splitText.reduce((arr, element, index) => (matches[index] ? [
      ...arr,
      element,
      <mark key={index} className="highlight">
        {matches[index]}
      </mark>,
    ] : [...arr, element]), []);

  }

  // Logic for highlighting across multiple text items
  // *** FROM github.com/wojtekmaj/react-pdf/issues/614#issuecomment-664212981 (slightly adapted) ***
  function getTextItemWithNeighbors(textItems, itemIndex, span = 1) {
    return textItems
      .slice(Math.max(0, itemIndex - span), itemIndex + 1 + span)
      .filter(Boolean)
      .map(item => item.str)
      .join(""); // CC set to " " i/o ""
  }

  function getIndexRange(string, substring) {
    const indexStart = string.indexOf(substring);
    const indexEnd = indexStart + substring.length;
    return [indexStart, indexEnd];
  }

  const onPageLoadSuccess = useCallback(async page => {
    const textContent = await page.getTextContent();
    setTextItems(textContent.items);
    removeTextLayerOffset();
  }, [])

  const textRenderer = useCallback(textItem => {
    if (!textItems) {
      return;
    }

    const { itemIndex } = textItem;

    var leftPartialMatches = [];
    var rightPartialMatches = [];

    // Look for partial matches across multiple text items...
    for (const stringToHighlight of stringsToHighlight) {

      // Check across multiple items
      const textItemWithNeighbors = getTextItemWithNeighbors(textItems, itemIndex);
      const matchInTextItemWithNeighbors = textItemWithNeighbors.match(stringToHighlight);
      if (!matchInTextItemWithNeighbors) {
        continue;
      }

      // Find where it starts and ends within multiple items
      const [matchIndexStart, matchIndexEnd] = getIndexRange(textItemWithNeighbors, stringToHighlight);
      const [textItemIndexStart, textItemIndexEnd] = getIndexRange(textItemWithNeighbors, textItem.str);
      if (matchIndexEnd < textItemIndexStart || matchIndexStart > textItemIndexEnd) {
        continue;
      }

      // Find partial match in a line
      const indexOfCurrentTextItemInMergedLines = textItemWithNeighbors.indexOf(textItem.str);
      const matchIndexStartInTextItem = Math.max(0, matchIndexStart - indexOfCurrentTextItemInMergedLines);
      const matchIndexEndInTextItem = matchIndexEnd - indexOfCurrentTextItemInMergedLines;
      const partialStringToHighlight = textItem.str.slice(matchIndexStartInTextItem, matchIndexEndInTextItem);

      // Save partial match
      if (matchIndexStartInTextItem == 0) {
        leftPartialMatches.push(partialStringToHighlight);
      } else {
        rightPartialMatches.push(partialStringToHighlight);
      }

    }

    return highlightPattern(textItem.str, stringsToHighlight, leftPartialMatches, rightPartialMatches);

  }, [stringsToHighlight, textItems]);
  // *** END FROM ***

  return (
    <div className="resume">
      <div id="upload-box">
        <Button variant="contained" id="button" onClick={handleClick}>
          Upload a PDF
        </Button>
        <input type="file" ref={hiddenFileInput} onChange={handleUpload} accept=".pdf" style={{display: 'none'}}/>
      </div>
      <div id="pdf-box">
        <div>
          <div className="sidebyside">
            <div>
              <ResearcherInfo/>
              <Summary sections={sectionTexts} summarizer={summarize} />
            </div>

            {file && 
              <Document id="pdf"
              file={file}
              onLoadSuccess={onDocumentLoadSuccess}
              >
                <Page
                  customTextRenderer={textRenderer}
                  pageNumber={pageNumber}
                  onLoadSuccess={onPageLoadSuccess}
                />
              </Document>
            }
          </div>
          {file &&
            <div>
              <p>
                Page {pageNumber || (numPages ? 1 : '--')} of {numPages || '--'}
              </p>
              <Button
                disabled={pageNumber <= 1}
                onClick={previousPage}
                variant="contained" 
                id={pageNumber <= 1 ? "disabled" : "button"}
              >
                Previous
              </Button>
              <Button
                disabled={pageNumber >= numPages}
                onClick={nextPage}
                variant="contained" 
                id={pageNumber >= numPages ? "disabled" : "button"}
              >
              Next
              </Button>
            </div>
          } 
        </div>
      </div>
    </div>
  );
}
