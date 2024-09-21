import React from 'react';
import "./LineChart.css";
import { Line } from 'react-chartjs-2';

class LineChart extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      offset: Math.floor(Math.random() * 100)
    };
  }

  render() {
    return (
      <div className="line-chart-report">
        <h2>{this.props.chart.title}</h2>
        <div className="line-chart-js">
          <Line className="line-chart-js"
            options={{
              plugins: {
                autocolors: {
                  mode: 'dataset',
                  offset: this.state.offset
                },
                legend: {
                  display: false
                }
              }
            }
            }
            data={{
              labels: this.props.chart.data.map(element => element.label),
              datasets: [{
                data: this.props.chart.data.map(element => element.value),
                tension: 0.1,
                drawActiveElementsOnTop: false,
              }]
            }} />
        </div>
      </div>
    );
  }
}

export default LineChart;
