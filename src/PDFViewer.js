import 'react-pdf/dist/umd/Page/AnnotationLayer.css';
import React, { useCallback,  useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@material-ui/core';
import { render } from '@testing-library/react';
import ResearcherInfo from './ResearcherInfo';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function PDFViewer() {

  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  function getText(uploadedFile) {

    var fileReader = new FileReader();
    fileReader.onload = function() {

        var typedArray = new Uint8Array(this.result);

        pdfjs.getDocument(typedArray).promise.then(function(pdf) {

            pdf.getPage(1).then(function(page) {
              var viewport = page.getViewport(1);
              page.getTextContent().then(function (textContent) {
                console.log(textContent)
              });
            });

        });
    }

    fileReader.readAsArrayBuffer(uploadedFile);

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

  const [file, setFile] = React.useState("");
  
  function handleUpload(event) {
    const uploadedFile = event.target.files[0];
    setFile(uploadedFile);
    getText(uploadedFile);
  }

  const hiddenFileInput = React.useRef(null);

  const handleClick = event => {
    hiddenFileInput.current.click();
  }

  // Highlight recipe: https://github.com/wojtekmaj/react-pdf/wiki/Recipes#highlight-text-on-the-page
  function highlightPattern(text, toHighlight, left=[], right=[]) {

    // TODO: require left patterns to be on left, right on right
    const patterns = [...toHighlight, ...left, ...right];
    const allPatterns = new RegExp(patterns.join('|'), 'gi');

    const splitText = text.split(allPatterns);
    if (splitText.length <= 1) {
      return text;
    }

    const matches = text.match(allPatterns);
    return splitText.reduce((arr, element, index) => (matches[index] ? [
      ...arr,
      element,
      <mark key={index}>
        {matches[index]}
      </mark>,
    ] : [...arr, element]), []);

  };

  // Logic for highlighting across multiple text items
  // *** FROM https://github.com/wojtekmaj/react-pdf/issues/614#issuecomment-664212981 (slightly adapted) ***
  const [textItems, setTextItems] = useState();
  const [stringsToHighlight, setStringsToHighlight] = useState(['SARS-CoV-2', 'D614G', 'G614', 'COVID-19', 'epidemiology', 'pseudoviruses']);

  function getTextItemWithNeighbors(textItems, itemIndex, span = 1, includeSpace = true) {
    return textItems
      .slice(Math.max(0, itemIndex - span), itemIndex + 1 + span)
      .filter(Boolean)
      .map(item => item.str)
      .join(includeSpace ? ' ' : ''); // CC added space
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
  }, []);

  const textRenderer = useCallback(textItem => {
    if (!textItems) {
      return;
    }

    const { itemIndex } = textItem;

    var leftPartialMatches = [];
    var rightPartialMatches = [];

    for (const stringToHighlight of stringsToHighlight) {

      /* Look for search string in item
      const matchInTextItem = textItem.str.match(stringToHighlight);
      if (matchInTextItem) {
        continue;
      } */

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
            <ResearcherInfo/>

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
