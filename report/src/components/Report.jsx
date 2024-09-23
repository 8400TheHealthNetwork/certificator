import React from 'react';
import "./Report.css";
import Chart from "chart.js/auto";
import autocolorPlugin from 'chartjs-plugin-autocolors';
import PieChart from './PieChart'
import LineChart from './LineChart'
import TableChart from './TableChart';
Chart.register(autocolorPlugin)

class Report extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        {this.props.data.charts.map(chart => {
          if (chart.type === 'pie') {
            return <PieChart key={chart.id} chart={chart}></PieChart>
          }
          if (chart.type === 'line') {
            return <LineChart key={chart.id} chart={chart}></LineChart>
          }
          if (chart.type === 'table') {
            return <TableChart key={chart.id} chart={chart}></TableChart>
          }
        }
        )}
      </div>
    );
  }
}

export default Report;