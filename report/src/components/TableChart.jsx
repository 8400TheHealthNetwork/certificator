import React from 'react';
import "./TableChart.css";

import { CompactTable } from '@table-library/react-table-library/compact';
import { useTheme } from '@table-library/react-table-library/theme';

class TableChart extends React.Component {
  constructor(props) {
    super(props);
    console.log(props)
    this.state = {
      columns: props.chart.columns.map(column => {
        return {
          label: column.label,
          renderCell: item => item[column.property],
          resize: true
        }
      }),
      theme: useTheme({
        Table: `
            --data-table-library_grid-template-columns: repeat(${props.chart.columns.length}, minmax(auto, 300px));
          `,
        HeaderRow: `
          .th {
            border-bottom: 1px solid #c2c7ce;
            background-color: #f1f7ff;
          }
        `,
        BaseCell: `
          background-color: #f1f7ff;
          &:not(:last-of-type) {
            border-right: 1px solid #d9dee5;
          }
          // border: 1px solid #a0a8ae;
  
          padding: 8px 16px;
        `,
        BaseRow: `
          &:not(:last-of-type) 
            .td {
              border-bottom: 1px solid #d9dee5;
            }
        `
      }),
    }
    console.log(this.state)
  }

  render() {
    return (
      <div className="table-chart-report">
        <h2>{this.props.chart.title}</h2>
        <div className="table-chart-js" style={this.props.chart.data.length > 13 ? {height: '500px'} : {}}>
          <CompactTable
            columns={this.state.columns}
            data={{ nodes: this.props.chart.data }}
            layout={{ custom: true, verticalScroll: this.props.chart.data.length > 13, horizontalScroll: true, fixedHeader: true }}
            theme={this.state.theme}
          />
        </div>
      </div>
    );
  }
}

export default TableChart;
