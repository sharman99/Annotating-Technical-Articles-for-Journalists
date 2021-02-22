import 'react-pdf/dist/umd/Page/AnnotationLayer.css';
import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@material-ui/core';
import { render } from '@testing-library/react';
import ResearcherInfo from './ResearcherInfo';
import { AnnotationFactory } from 'annotpdf';

//import PDFWorker from "worker-loader!pdfjs-dist/lib/pdf.worker";
import PDFWorker from "worker-loader!pdfjs-dist/lib/pdf.worker";
//import { Worker } from "@react-pdf-viewer/core";


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

/* react-pdf-highlighter */
import Spinner from "./Spinner";
import Sidebar from "./Sidebar";
import testHighlights from "./test-highlights";
import "./style/App.css";
const getNextId = () => String(Math.random()).slice(2);
const parseIdFromHash = () => document.location.hash.slice("#highlight-".length);
const resetHash = () => { document.location.hash = ""; };

setPdfWorker(PDFWorker);

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const HighlightPopup = ({ comment }) =>
  comment.text ? (
    <div className="Highlight__popup">
      {comment.emoji} {comment.text}
    </div>
  ) : null;

const PRIMARY_PDF_URL = "https://arxiv.org/pdf/1708.08021.pdf";
const SECONDARY_PDF_URL = "https://arxiv.org/pdf/1604.02480.pdf";

const searchParams = new URLSearchParams(document.location.search);

const initialUrl = searchParams.get("url") || PRIMARY_PDF_URL;

export default function PDFViewer() {

  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [val, setVal] = useState(0); 
  const [file, setFile] = React.useState("");
  const [d, setD] = React.useState(""); 

  // react-pdf-highlighter
  const [url, setUrl] = React.useState(initialUrl);
  const [highlights, setHighlights] = React.useState(testHighlights[initialUrl] ? [...testHighlights[initialUrl]] : []);

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

  // react-pdf-highlighter
  function resetHighlights() { 
    setHighlights([]); 
  }

  function toggleDocument() {
    const newUrl =
      this.state.url === PRIMARY_PDF_URL ? SECONDARY_PDF_URL : PRIMARY_PDF_URL;

    setUrl(newUrl);
    setHighlights(testHighlights[newUrl] ? [...testHighlights[newUrl]] : []);
  };

  //scrollViewerTo = (highlight: any) => {};
  function scrollViewerTo(highlight) { 
    return {};
  };

  /*getHighlightById(id: string) {
    const { highlights } = this.state;

    return highlights.find(highlight => highlight.id === id);
  }*/
  function getHighlightById(id: string) { 
    return highlights.find(highlight => highlight.id === id);
  };

  /*scrollToHighlightFromHash = () => {
    const highlight = this.getHighlightById(parseIdFromHash());

    if (highlight) {
      this.scrollViewerTo(highlight);
    }
  };*/
  function scrollToHighlightFromHash() { 
    const highlight = getHighlightById(parseIdFromHash());
    if (highlight) {
      scrollViewerTo(highlight);
    }
  };

  /*componentDidMount() {
    window.addEventListener(
      "hashchange",
      this.scrollToHighlightFromHash,
      false
    );
  }*/
  function componentDidMount() {
    window.addEventListener(
      "hashchange",
      this.scrollToHighlightFromHash,
      false
    );
  }

  /*addHighlight(highlight: T_NewHighlight) {
    const { highlights } = this.state;

    console.log("Saving highlight", highlight);

    this.setState({
      highlights: [{ ...highlight, id: getNextId() }, ...highlights]
    });
  }*/
  function addHighlight(highlight: T_NewHighlight) { 
    console.log("Saving highlight", highlight);
    setHighlights([{...highlight, id: getNextId()  }, ...highlights]);
  };

  /*updateHighlight(highlightId: string, position: Object, content: Object) {
    console.log("Updating highlight", highlightId, position, content);

    this.setState({
      highlights: this.state.highlights.map(h => {
        const {
          id,
          position: originalPosition,
          content: originalContent,
          ...rest
        } = h;
        return id === highlightId
          ? {
              id,
              position: { ...originalPosition, ...position },
              content: { ...originalContent, ...content },
              ...rest
            }
          : h;
      })
    });
  }*/

  function updateHighlight(highlightId: String, position: Object, content: Object) {
    console.log("Updating higlight", highlightId, position, content); 
    
    const newHighlights = highlights.map(h => {
      const {
        id,
        position: originalPosition,
        content: originalContent,
        ...rest
      } = h;
      return id === highlightId
        ? {
            id,
            position: { ...originalPosition, ...position },
            content: { ...originalContent, ...content },
            ...rest
          }
        : h;
    });

    setHighlights(newHighlights);

  };

  console.log("url is ", url);
  return (
    <div className="App" style={{ display: "flex", height: "100vh" }}>
      <Sidebar
        highlights={highlights}
        resetHighlights={resetHighlights}
        toggleDocument={toggleDocument}
      />
      <div
        style={{
          height: "100vh",
          width: "75vw",
          position: "relative"
        }}
      >
        <PdfLoader url={url} beforeLoad={<Spinner />}>
          {pdfDocument => {
            console.log("pdfDocument ", pdfDocument); 
            return (
            <PdfHighlighter
              pdfDocument={pdfDocument}
              enableAreaSelection={event => event.altKey}
              onScrollChange={resetHash}
              // pdfScaleValue="page-width"
              scrollRef={scrollTo => {
                scrollViewerTo = scrollTo;

                scrollToHighlightFromHash();
              }}
              onSelectionFinished={(
                position,
                content,
                hideTipAndSelection,
                transformSelection
              ) => (
                <Tip
                  onOpen={transformSelection}
                  onConfirm={comment => {
                    addHighlight({ content, position, comment });

                    hideTipAndSelection();
                  }}
                />
              )}
              highlightTransform={(
                highlight,
                index,
                setTip,
                hideTip,
                viewportToScaled,
                screenshot,
                isScrolledTo
              ) => {
                const isTextHighlight = !Boolean(
                  highlight.content && highlight.content.image
                );

                const component = isTextHighlight ? (
                  <Highlight
                    isScrolledTo={isScrolledTo}
                    position={highlight.position}
                    comment={highlight.comment}
                  />
                ) : (
                  <AreaHighlight
                    highlight={highlight}
                    onChange={boundingRect => {
                      updateHighlight(
                        highlight.id,
                        { boundingRect: viewportToScaled(boundingRect) },
                        { image: screenshot(boundingRect) }
                      );
                    }}
                  />
                );

                return (
                  <Popup
                    popupContent={<HighlightPopup {...highlight} />}
                    onMouseOver={popupContent =>
                      setTip(highlight, highlight => popupContent)
                    }
                    onMouseOut={hideTip}
                    key={index}
                    children={component}
                  />
                );
              }}
              highlights={highlights}
            />
          )}
          }
        </PdfLoader>
      </div>
    </div>
  );
  /*return (
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
  );*/
  function rph_render() {
    const { url, highlights } = this.state;

    return (
      <div className="App" style={{ display: "flex", height: "100vh" }}>
        <Sidebar
          highlights={highlights}
          resetHighlights={this.resetHighlights}
          toggleDocument={this.toggleDocument}
        />
        <div
          style={{
            height: "100vh",
            width: "75vw",
            position: "relative"
          }}
        >
          <PdfLoader url={url} beforeLoad={<Spinner />}>
            {pdfDocument => (
              <PdfHighlighter
                pdfDocument={pdfDocument}
                enableAreaSelection={event => event.altKey}
                onScrollChange={resetHash}
                // pdfScaleValue="page-width"
                scrollRef={scrollTo => {
                  this.scrollViewerTo = scrollTo;

                  this.scrollToHighlightFromHash();
                }}
                onSelectionFinished={(
                  position,
                  content,
                  hideTipAndSelection,
                  transformSelection
                ) => (
                  <Tip
                    onOpen={transformSelection}
                    onConfirm={comment => {
                      this.addHighlight({ content, position, comment });

                      hideTipAndSelection();
                    }}
                  />
                )}
                highlightTransform={(
                  highlight,
                  index,
                  setTip,
                  hideTip,
                  viewportToScaled,
                  screenshot,
                  isScrolledTo
                ) => {
                  const isTextHighlight = !Boolean(
                    highlight.content && highlight.content.image
                  );

                  const component = isTextHighlight ? (
                    <Highlight
                      isScrolledTo={isScrolledTo}
                      position={highlight.position}
                      comment={highlight.comment}
                    />
                  ) : (
                    <AreaHighlight
                      highlight={highlight}
                      onChange={boundingRect => {
                        this.updateHighlight(
                          highlight.id,
                          { boundingRect: viewportToScaled(boundingRect) },
                          { image: screenshot(boundingRect) }
                        );
                      }}
                    />
                  );

                  return (
                    <Popup
                      popupContent={<HighlightPopup {...highlight} />}
                      onMouseOver={popupContent =>
                        setTip(highlight, highlight => popupContent)
                      }
                      onMouseOut={hideTip}
                      key={index}
                      children={component}
                    />
                  );
                }}
                highlights={highlights}
              />
            )}
          </PdfLoader>
        </div>
      </div>
    );
  }
}
