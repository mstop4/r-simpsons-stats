import React from 'react';

const SeasonDetails = (props) => ( 
  <div>
    <input id='season-details' type='checkbox' onChange={props.handleChange} checked={props.checked}></input>
    <label htmlFor='season-details'>Season Details</label>
  </div>
);

export default SeasonDetails;