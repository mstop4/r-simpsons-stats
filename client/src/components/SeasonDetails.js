import React from 'react';

const SeasonDetails = (props) => ( 
  <input type='checkbox' onChange={props.handleChange} checked={props.checked}></input>
);

export default SeasonDetails;