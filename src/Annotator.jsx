import 'react-pdf/dist/umd/Page/AnnotationLayer.css';
import React, { useState } from 'react';
import { pdfjs } from 'react-pdf';
import { Button } from '@material-ui/core';

import { getDoPaperDigest } from './paperDigest';
import PDFViewer from './PDFViewer';
import ResearcherInfo from './ResearcherInfo';
import Summary from './Summary';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function Annotator() {

  const [file, setFile] = React.useState('');
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [getPD, _] = useState(() => getDoPaperDigest());
  const [sectionTexts, setSectionTexts] = useState([]);
  const hiddenFileInput = React.useRef(null);

  const handleClick = event => {
    hiddenFileInput.current.click();
  };

  const handleUpload = event => {
    const uploadedFile = event.target.files[0];
    setFile(uploadedFile);
    extractText(uploadedFile, (text) => {
      setText(text);
      setSectionTexts(splitBySection(text));
    });
  };

  const extractText = (uploadedFile, callback) => {

    const fileReader = new FileReader();
    fileReader.onload = function() {

        const typedArray = new Uint8Array(this.result);
        pdfjs.getDocument(typedArray).promise.then(pdf => {

            pdf.getMetadata().then(metadata => {
              const title = metadata.info['Title'] || (
                metadata.metadata
                  ? metadata.metadata.get('dc:title')
                  : '');
              if (title) {
                setTitle(title);
              } else {
                getPD(uploadedFile)
                  .then(result => {
                    console.log("Paper digest result ", result);
                    const title = result.metadata.title;
                    console.log("From paper digest got title ", title);
                    setTitle(title);
                  });
              }
            });

            const pageTextPromises = [...Array(pdf.numPages).keys()].map(pageN =>
              pdf.getPage(pageN + 1).then(page =>
                page.getTextContent().then(textContent =>
                  textContent.items.map(item => item.str).join(' ').replace(/- /g, '')
                )
              )
            );

            Promise.all(pageTextPromises).then(pageTexts => callback(pageTexts.join(' ')));

        });
    };

    fileReader.readAsArrayBuffer(uploadedFile);

  };

  const splitBySection = text => {

    const sectionHeaders = ['Abstract', 'Introduction', 'Results', 'Methods', 'Discussion', 'Conclusion', 'Conclusions', 'References', 'Funding'];

    let currentSectionWords = [];
    let currentSectionName = '';
    let sectionTexts = [{ 'name' : 'All', 'text' : text }];
    let firstSectionText = '';

    for (const word of text.split(' ')) {
      if (word.length === 0) {
        continue;
      }

      const titleCaseWord = word[0].toUpperCase() + word.substr(1).toLowerCase();
      if (sectionHeaders.includes(word) || sectionHeaders.includes(titleCaseWord)) {

        if (!currentSectionName) {
          firstSectionText = currentSectionWords.join(' ');
        } else if (currentSectionName) { // ignore text before first section name
          sectionTexts.push({ 'name' : currentSectionName, 'text' : currentSectionWords.join(' ') });
        }
        currentSectionName = sectionHeaders.find(sH => sH === word) || sectionHeaders.find(sH => sH === titleCaseWord);
        currentSectionWords = [];

      } else {
        currentSectionWords.push(word);
      }
    }

    sectionTexts.push({ 'name' : currentSectionName, 'text' : currentSectionWords.join(' ') });

    //If still haven't seen abtract, asusme whatever came before first section was that
    const abstractCheck = sectionTexts.find(s => s['name'] === 'Abstract');
    if (typeof abstractCheck == 'undefined') {
      sectionTexts.splice(1, 0, { 'name' : 'Abstract', 'text' : firstSectionText });
    }

    return sectionTexts;

  };

  return (
    <div className='resume'>
      <div id='header'>
        <Button variant='contained' id='button' onClick={handleClick}>
          Upload a PDF
        </Button>
        <input type='file' ref={hiddenFileInput} onChange={handleUpload} accept='.pdf' style={{display: 'none'}}/>
      </div>
      {file && (<div id='pdf-box'>
        <div className='sidebyside'>
          <div>
            <ResearcherInfo title={title} />
            <Summary
              file={file}
              getPD={getPD}
              sectionTexts={sectionTexts}
              title={title}
            />
          </div>
          <PDFViewer file={file} sectionTexts={sectionTexts} text={text} />
        </div>
      </div>)}
      {!file && (
        <div id='explainer'>
          <div id='explainer-text-container'>
            <span id='logo' className='explainer-text'>
              Annotating technical articles
            </span>
            <span className='explainer-text'>
              Upload a PDF to get started
            </span>
          </div>
        </div>
      )}
    </div>
  );

}
