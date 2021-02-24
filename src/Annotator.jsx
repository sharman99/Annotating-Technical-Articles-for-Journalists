import 'react-pdf/dist/umd/Page/AnnotationLayer.css';
import React, { useState } from 'react';
import { pdfjs } from 'react-pdf';
import { Button } from '@material-ui/core';

import PDFViewer from './PDFViewer';
import ResearcherInfo from './ResearcherInfo';
import Summary from './Summary';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function Annotator() {

  const [file, setFile] = React.useState('');
  const [text, setText] = useState('');
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

            const pageTextPromises = [...Array(pdf.numPages).keys()].map(pageN =>
              pdf.getPage(pageN + 1).then(page =>
                page.getTextContent().then(textContent =>
                  textContent.items.map(item => item.str).join(' ')
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

    for (const word of text.split(' ')) {
      if (word.length === 0) {
        continue;
      }

      const titleCaseWord = word[0].toUpperCase() + word.substr(1).toLowerCase();
      if (sectionHeaders.includes(word) || sectionHeaders.includes(titleCaseWord)) {

        if (currentSectionName) { // ignore text before first section name
          sectionTexts.push({ 'name' : currentSectionName, 'text' : currentSectionWords.join(' ') });
        }
        currentSectionName = sectionHeaders.find(sH => sH === word) || sectionHeaders.find(sH => sH === titleCaseWord);
        currentSectionWords = [];

      } else {
        currentSectionWords.push(word);
      }
    }

    sectionTexts.push({ 'name' : currentSectionName, 'text' : currentSectionWords.join(' ') });
    return sectionTexts;

  };

  return (
    <div className='resume'>
      <div id='upload-box'>
        <Button variant='contained' id='button' onClick={handleClick}>
          Upload a PDF
        </Button>
        <input type='file' ref={hiddenFileInput} onChange={handleUpload} accept='.pdf' style={{display: 'none'}}/>
      </div>
      <div id='pdf-box'>
        <div className='sidebyside'>
          <div>
            <ResearcherInfo/>
            <Summary sections={sectionTexts} />
          </div>
          <PDFViewer file={file} sectionTexts={sectionTexts} text={text} />
        </div>
      </div>
    </div>
  );

}
