import 'react-pdf/dist/umd/Page/AnnotationLayer.css';
import React, { useCallback,  useEffect, useState } from 'react';
import ReactTooltip from 'react-tooltip';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@material-ui/core';
import { identifyTerms } from './terms';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';

const termExtractors = ["Natural", "Compromise", "Rake", "Retext Key Terms", "Retext Key Phrases"];

const wtf = require('wtf_wikipedia');

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function PDFViewer({ text, file, sectionTexts }) {

  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [textItems, setTextItems] = useState();
  const [selectedTermExtractor, setSelectedTermExtractor] = useState("Retext Key Phrases");
  const [keyTerms, setKeyTerms] = useState([]);
  const [explanations, setExplanations] = useState({});
  var matchedPatterns = [];

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  console.log("PDFViewer render with selectedTermExtractor", selectedTermExtractor);

  const changePage = (offset) => {
    setPageNumber(prevPageNumber => prevPageNumber + offset);
  };

  const removeTextLayerOffset = () => {
    const textLayers = document.querySelectorAll('.react-pdf__Page__textContent');
      textLayers.forEach(layer => {
        const { style } = layer;
        style.top = '0';
        style.left = '0';
        style.transform = '';
    });
  };

  const getExplanations = terms => {
    // Search Wikipedia for each term
    const wikiSearches = terms.map(term => wtf.fetch(term)
      .then(doc => [term, (doc && doc.sentences(0)) ? `${doc.sentences(0).text()} (Wikipedia)` : term]));

    Promise.all(wikiSearches).then(wikipediaResults => {
      setExplanations(prevExplanations => ({ ...prevExplanations, ...Object.fromEntries(wikipediaResults) }));
    });
  };

  if (text && keyTerms.length === 0) {
    identifyTerms(text, selectedTermExtractor, terms => {
      console.log("n key terms ", terms.length);
      getExplanations(terms);
      setKeyTerms(terms);
    });
  }

  useEffect(() => ReactTooltip.rebuild());

  const getTooltipText = term => explanations[term] || `Couldn't find Wikipedia page for ${term}`;

  // Highlight recipe: github.com/wojtekmaj/react-pdf/wiki/Recipes#highlight-text-on-the-page
  const highlightPattern = (text, toHighlight, left=[], right=[]) => {

    // https://stackoverflow.com/a/6969486/2809263
    const escapeForRegex = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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
      <mark
        key={index}
        className='highlight'
        data-tip={getTooltipText(matches[index])}
        data-for='highlight-tooltip'
      >
        {matches[index]}
      </mark>,
    ] : [...arr, element]), []);
  };

  // Logic for highlighting across multiple text items
  // *** FROM github.com/wojtekmaj/react-pdf/issues/614#issuecomment-664212981 (slightly adapted) ***
  const getTextItemWithNeighbors = (textItems, itemIndex, span = 1) => (
    textItems.slice(Math.max(0, itemIndex - span), itemIndex + 1 + span)
      .filter(Boolean)
      .map(item => item.str)
      .join('')
  );

  const getIndexRange = (string, substring) => (
    [string.indexOf(substring), string.indexOf(substring) + substring.length]
  );

  const onPageLoadSuccess = useCallback(async page => {
    const textContent = await page.getTextContent();
    setTextItems(textContent.items);
    removeTextLayerOffset();
  }, []);

  const textRenderer = useCallback(textItem => {
    if (!textItems) {
      return;
    }

    const { itemIndex } = textItem;

    var leftPartialMatches = [];
    var rightPartialMatches = [];

    // Look for partial matches across multiple text items...
    for (const keyTerm of keyTerms) {

      // Check across multiple items
      const textItemWithNeighbors = getTextItemWithNeighbors(textItems, itemIndex);
      const matchInTextItemWithNeighbors = textItemWithNeighbors.match(keyTerm);
      if (!matchInTextItemWithNeighbors) {
        continue;
      }

      // Find where it starts and ends within multiple items
      const [matchIndexStart, matchIndexEnd] = getIndexRange(textItemWithNeighbors, keyTerm);
      const [textItemIndexStart, textItemIndexEnd] = getIndexRange(textItemWithNeighbors, textItem.str);
      if (matchIndexEnd < textItemIndexStart || matchIndexStart > textItemIndexEnd) {
        continue;
      }

      // Find partial match in a line
      const indexOfCurrentTextItemInMergedLines = textItemWithNeighbors.indexOf(textItem.str);
      const matchIndexStartInTextItem = Math.max(0, matchIndexStart - indexOfCurrentTextItemInMergedLines);
      const matchIndexEndInTextItem = matchIndexEnd - indexOfCurrentTextItemInMergedLines;
      const partialKeyTerm = textItem.str.slice(matchIndexStartInTextItem, matchIndexEndInTextItem);

      // Save partial match
      if (matchIndexStartInTextItem === 0) {
        leftPartialMatches.push(partialKeyTerm);
      } else {
        rightPartialMatches.push(partialKeyTerm);
      }

    }

    return highlightPattern(textItem.str, keyTerms, leftPartialMatches, rightPartialMatches);

  }, [keyTerms, textItems, explanations]);

  const handleTermExtractorChange = event => {
    setKeyTerms([]);
    const newTermExtractor = event.target.value;
    setSelectedTermExtractor(newTermExtractor);
  };

  return (
    <div>
      <ReactTooltip id='highlight-tooltip' className='highlight-tooltip' />
      <Select
        labelId='termExtractor-select-label'
        id='termExtractor-select'
        value={selectedTermExtractor}
        onChange={handleTermExtractorChange}
      >
        {termExtractors.map(tE => (
          <MenuItem value={tE}>{tE}</MenuItem>
        ))}
      </Select>
      {file &&
        <Document id='pdf'
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
      {file &&
        <div>
          <p>
            Page {pageNumber || (numPages ? 1 : '--')} of {numPages || '--'}
          </p>
          <Button
            disabled={pageNumber <= 1}
            id={pageNumber <= 1 ? 'disabled' : 'button'}
            onClick={() => changePage(-1)}
            variant='contained'
          >
            Previous
          </Button>
          <Button
            disabled={pageNumber >= numPages}
            id={pageNumber >= numPages ? 'disabled' : 'button'}
            onClick={() => changePage(1)}
            variant='contained'
          >
            Next
          </Button>
        </div>
      }
    </div>
  );
}
