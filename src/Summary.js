import React from 'react';
import './App.css';

const Summary = ({ summary }) => (
  <div className='metadata'>
    <div><strong>Summary:</strong></div>
    {summary}
  </div>
);

export default Summary;
