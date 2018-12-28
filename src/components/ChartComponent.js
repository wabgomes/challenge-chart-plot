import React, { Component } from 'react';
import Highcharts from 'highcharts';
import {
  HighchartsChart, Chart, withHighcharts, XAxis, YAxis, Legend, LineSeries
} from 'react-jsx-highcharts';

class ChartComponent extends Component {
    constructor(){
        super();
        this.state = {
            msg: "chartComponentContent",
            chartDataList: [],
        };
        this.lastPropschartEventList = undefined;
    }

    render(){
        return (
            <div id="chartComponent">
                <HighchartsChart>
                    <Chart/>

                    <Legend layout="vertical" align="right" verticalAlign="top" />
            
                    <XAxis >
                        
                    </XAxis>
            
                    <YAxis 
                        visible={false}
                    >
                        {
                            this.state.chartDataList ? this.state.chartDataList
                            .map(chartData => 
                                    <LineSeries key={chartData.name} name={chartData.name} data={chartData.data}/>
                                    /*
                                    the data array contains various [x, y] arrays
                                    where x is the difference btwen the timestamp that generates that point and begin timestamp
                                    and y is the value present in the select field by each group
                                    */
                            ) : ""
                        }
                    </YAxis>
                </HighchartsChart>

            </div>
        );
    }

    componentDidUpdate(){
        //updates the data of the chart
        this.updateChart();
    }

    updateChart(){
        //this double verification prevents the infinite loop update between ChartComponent and App
        if(this.props.chartEventList){
            if(!this.lastPropsChartEventList || this.lastPropsChartEventList.id !== this.props.chartEventList.id){
                //preserving the last valid ChartEventList
                this.lastPropsChartEventList = this.props.chartEventList;
                let newChartDataList = this.props.chartEventList.getHighChartsChartDataList();
                if(newChartDataList){
                    this.setState({chartDataList:newChartDataList});
                }
                else //in case of fail construction throws the alert
                    alert("Cannot construct the new chart with that ChartEventList");
            }
        }
    }
}

export default withHighcharts(ChartComponent, Highcharts);