import 'react-pdf/dist/umd/Page/AnnotationLayer.css';
import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@material-ui/core';
import { render } from '@testing-library/react';
import ResearcherInfo from './ResearcherInfo';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

export default function PDFViewer() {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

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

  const [file, setFile] = React.useState("");
  
  function handleUpload(event) {
    setFile(event.target.files[0]);
  }

  const hiddenFileInput = React.useRef(null);

  const handleClick = event => {
    hiddenFileInput.current.click();
  }

  return (
    <div className="resume">
      <div id="upload-box">
        <Button variant="contained" id="button" onClick={handleClick}>
          Upload a PDF
        </Button>
        <input type="file" ref={hiddenFileInput} onChange={handleUpload} accept=".pdf" style={{display: 'none'}}/>
      </div>
      <div id="pdf-box">
      {file && 
        <div>
          <div className="sidebyside">
            <ResearcherInfo/>
            <Document id="pdf"
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            >
              <Page pageNumber={pageNumber} onLoadSuccess={removeTextLayerOffset}/>
            </Document>
            </div>
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
        </div>
      }
      </div>
    </div>
  );
}
