import React from 'react';

const SeasonSelector = (props) => ( 
  <div>
    <input id='season-selector' type='range' min='1' max={props.maxSeason} value={props.curSeason} onChange={props.handleChange}></input>
    <label htmlFor='season-selector'>Season {props.curSeason}</label>
  </div>
);

export default SeasonSelector;