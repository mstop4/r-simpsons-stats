import React from 'react';

const ChartHeader = (props) => {
  if (props.show) {
    return (
      <div>
        <p>Last updated: {props.dateString}</p>
        <p>Submission total: {props.chartTotal}</p>
      </div>
    );
  }

  else {
    return (<p>Fetching data...</p>);
  }
};

export default ChartHeader;