import React, { useState } from 'react';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';

import { summarize } from './summarize';

const Summary = ({ sections }) => {

  const [selectedSection, setSelectedSection] = useState('All');
  const [selectedSectionSummary, setSelectedSectionSummary] = useState('');

  const selectedSectionData = sections.find(s => s['name'] === selectedSection);
  if (selectedSectionData && !selectedSectionSummary) {
    summarize(selectedSectionData['text'], (summaries) => {
      setSelectedSectionSummary(summaries.lexrankSummary);
    });
  }

  const handleChange = event => {
    const newSection = event.target.value;
    if (newSection != selectedSection) {
      setSelectedSectionSummary('');
      setSelectedSection(newSection);
    }
  };

  return (
    <div className='metadata'>
      <div><strong>Summary:</strong></div>
      {sections && <Select
        labelId='demo-simple-select-label'
        id='demo-simple-select'
        value={selectedSection}
        onChange={handleChange}
      >
        {sections.map(section => (
          <MenuItem value={section['name']}>{section['name']}</MenuItem>
        ))}
      </Select>}
      {selectedSectionSummary}
    </div>
  );

};

export default Summary;
