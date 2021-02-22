import 'react-pdf/dist/umd/Page/AnnotationLayer.css';
import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@material-ui/core';
import { render } from '@testing-library/react';
import ResearcherInfo from './ResearcherInfo';
import { AnnotationFactory } from 'annotpdf';

import PDFWorker from "worker-loader!pdfjs-dist/lib/pdf.worker";

import {
  PdfLoader,
  PdfHighlighter,
  Tip,
  Highlight,
  Popup,
  AreaHighlight,
  setPdfWorker
} from "react-pdf-highlighter";
import type {
  T_Highlight,
  T_NewHighlight
} from "react-pdf-highlighter/src/types";

setPdfWorker(PDFWorker);

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function PDFViewer() {

  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [val, setVal] = useState(0); 
  const [file, setFile] = React.useState("");
  const [d, setD] = React.useState(""); 

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  function getText(uploadedFile) {

    var pdfFactory = undefined;

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

            
            
            pdf.getData().then(data => {
              pdfFactory = new AnnotationFactory(data);
              pdfFactory.createHighlightAnnotation(0, [0, 0, 100, 100], "content hih contents", "author");
              console.log("forcing update");
              setVal(val + 1);
              pdfFactory.getAnnotations().then(pfAnnos => {
                console.log("pfAnnos: ", pfAnnos);
              });
              pdfFactory.save("saved.pdf");
              setD(pdfFactory.write());
            });
            

            /*
            pdf.getPage(1).then(function(page) {
              page.getAnnotations().then(function(annos) {
                console.log("annos, ", annos);
              });
            });
            */

            console.log("currently uploadedFile is ", uploadedFile);
            console.log("setting file to ", pdf);
            //setFile(pdf);
            

        });
    };

    fileReader.readAsArrayBuffer(uploadedFile);

  }

  function highlightText(text) { 
    console.log("highlighText(", text, ")");
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

  function handleUpload(event) {
    const uploadedFile = event.target.files[0];
    setFile(uploadedFile);
    getText(uploadedFile);
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
        <div>
          <div className="sidebyside">
            <ResearcherInfo/>

            {file && 
              <Document id="pdf"
              file={file}
              onLoadSuccess={onDocumentLoadSuccess}
              >
                <Page pageNumber={pageNumber} onLoadSuccess={removeTextLayerOffset}/>
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
          {d &&
            <iframe
              title="frame"
              width="300px"
              height="700px"
              src={`data:application/pdf;base64,${d}`}
            />
          }
        </div>
      </div>
    </div>
  );
}
