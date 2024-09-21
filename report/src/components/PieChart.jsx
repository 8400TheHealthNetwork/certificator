import React from 'react';
import "./PieChart.css";
import { Pie } from 'react-chartjs-2';

class PieChart extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      offset: Math.floor(Math.random() * 100)
    };
  }

  render() {
    return (
      <div className="pie-chart-report">
        <h2>{this.props.chart.title}</h2>
        <div className="pie-chart-js">
          <Pie className="pie-chart-js"
            options={{
              plugins: {
                autocolors: {
                  mode: 'data',
                  offset: this.state.offset
                }
              }
            }
            }
            data={{
              labels: this.props.chart.data.map(element => element.label),
              datasets: [{
                // label: 'My First Dataset',
                data: this.props.chart.data.map(element => element.value),
              }]
            }} />
        </div>
      </div>
    );
  }
}

export default PieChart;
