import React, { useState } from 'react';
import './App.css';

import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';

const Summary = ({ sections, summarizer }) => {

  const [selectedSection, setSelectedSection] = useState("All");
  const [selectedSectionSummary, setSelectedSectionSummary] = useState("");

  const selectedSectionObj = sections.find(s => s["name"] === selectedSection);
  if (selectedSectionObj && !selectedSectionSummary) {
    summarizer(selectedSectionObj["text"], (summaries) => {
      console.log("setting summary");
      setSelectedSectionSummary(summaries.lexrankSummary);
    });
  }

  const handleChange = event => {
    const newSection = event.target.value;
    if (newSection != selectedSection) {
      setSelectedSectionSummary("");
      setSelectedSection(newSection);
    }
  };

  return (
    <div className='metadata'>
      <div><strong>Summary:</strong></div>
      {sections && <Select
        labelId="demo-simple-select-label"
        id="demo-simple-select"
        value={selectedSection}
        onChange={handleChange}
      >
        {sections.map(section => (
          <MenuItem value={section["name"]}>{section["name"]}</MenuItem>
        ))}
      </Select>}
      {selectedSectionSummary}
    </div>
  );
};

export default Summary;
