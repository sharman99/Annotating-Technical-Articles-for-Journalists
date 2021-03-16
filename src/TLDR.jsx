import React, { useState } from 'react';
import { summarize } from './summarize';
import * as constants from './constants';

const TLDR = ({ sectionTexts }) => {

  const [tldrText, setTLDRText] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);

  const selectedSummarizer = "SciTLDR";
  if (sectionTexts.length > 0 && !tldrText && !isSummarizing) {
    setIsSummarizing(true);
    summarize({
      selectedSummarizer,
      sectionTexts,
      callback: (text) => {
        console.log("tldr callback has text ", text);
        setTLDRText(text);
      },
    });
  }

  const text = tldrText || constants.SPINNER;

  return (
    <div className='metadata'>
      <div><strong>TL;DR</strong></div>
      { text }
      <div className='attribution'>
        From
        <span> </span>
        <a href='https://scitldr.apps.allenai.org/'>SciTLDR</a>
      </div>
    </div>
  );

};

export default TLDR;
