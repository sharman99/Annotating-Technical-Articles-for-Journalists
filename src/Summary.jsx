import React, { useState } from 'react';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';

import { summarize } from './summarize';

const summarizers = ["Bart", "TextRank", "JSTeaser", "Sum", "Paper Digest", "LexRank", "Text Monkey", "Vectorspace" ];

const fixedSectionSummarizers = [
  { name: 'Paper Digest', sections: ["introduction", "results", "discussion", "conclusions"] },
];

const Summary = ({ file, getPD, sectionTexts, title }) => {

  const [selectedSummarizer, setSelectedSummarizer] = useState('LexRank');

  // Set up available sections
  const fixedSectionSummarizer = fixedSectionSummarizers.find(s => s['name'] === selectedSummarizer);
  const availableSections = (typeof fixedSectionSummarizer !== 'undefined')
      ? fixedSectionSummarizer.sections
      : sectionTexts.map(section => section['name']);
  const defaultSection = availableSections[0];
  const [selectedSection, setSelectedSection] = useState(defaultSection);
  if (defaultSection && typeof selectedSection === 'undefined') {
    setSelectedSection(defaultSection);
  }

  const [selectedSectionSummary, setSelectedSectionSummary] = useState('');

  if (selectedSection && !selectedSectionSummary) {
    summarize({
      selectedSummarizer,
      selectedSection,
      getPD,
      sectionTexts,
      file,
      title,
      callback: (summary) => {
        console.log("summarizer returned ", summary);
        setSelectedSectionSummary(summary);
      }
    });
  }

  const handleSummarizerChange = event => {
    const newSummarizer = event.target.value;
    setSelectedSummarizer(newSummarizer);
    setSelectedSection(undefined);
    setSelectedSectionSummary('');
  };

  const handleSectionChange = event => {
    const newSection = event.target.value;
    if (newSection != selectedSection) {
      setSelectedSection(newSection);
      setSelectedSectionSummary('');
    }
  };

  const formatSectionName = sN => sN.charAt(0).toUpperCase() + sN.substring(1).toLowerCase();

  return (
    <div className='metadata'>
      <div><strong>Summary:</strong></div>
      {summarizers && <Select
        labelId='summarizer-select-label'
        id='summarizer-select'
        value={selectedSummarizer}
        onChange={handleSummarizerChange}
      >
        {summarizers.map(summarizer => (
          <MenuItem value={summarizer}>{summarizer}</MenuItem>
        ))}
      </Select>}
      {(availableSections && selectedSection) && <Select
        labelId='demo-simple-select-label'
        id='demo-simple-select'
        value={selectedSection}
        onChange={handleSectionChange}
      >
        {availableSections.map(section => (
          <MenuItem value={section}>{formatSectionName(section)}</MenuItem>
        ))}
      </Select>}
      {selectedSectionSummary}
    </div>
  );

};

export default Summary;
