import React, { Component } from 'react';
import ChartComponent from './components/ChartComponent';
import ChartEventList from './model/ChartEventList';
import ResizableTextEditor from './components/ResizebleTextEditor';

const myName = 'William Gomes';
class App extends Component {
  constructor(){
    super();
    this.state = {
      eventsText: '',
      chartEventList: undefined
    };
    this.generateEventList = this.generateEventList.bind(this);
    this.setCodeMirrorEventsText = this.setCodeMirrorEventsText.bind(this);
  }

  //callback that does the bind with the ResizebleTextEditor
  setCodeMirrorEventsText(newCodeEventsText){
    this.setState({eventsText: newCodeEventsText});
  }

  render() {
    return (
      <div id="app">
        
            <div className="app-title font-sans-pro">
              <h4>{myName}'s Challenge</h4>
            </div>
        
          <div className="top-content font-code-pro">
          {/* component with the code area and resize logic */}
            <ResizableTextEditor updateExternalModel={(value) => this.setCodeMirrorEventsText(value)}></ResizableTextEditor>
            <span>ATTENTION: SOMETIMES TO RESIZE THE CODE AREA, YOU NEED TO SCROLL AT THA LAST LINE AND THE CURSOR WILL CHANGE TO THE RESIZE CURSOR</span>
          </div>

          <div id="middleContent" className="middle-content font-sans-pro" tabIndex="-2">
              {/* component which encapsulates the chart configuration and the necessary data construction steps */}
              <ChartComponent chartEventList={this.state.chartEventList}/>
          </div>
          {/* footer pinned with css only by my acknowledgement limitation */}
          <footer className="app-footer font-sans-pro">
            <button className="btn btn-primary" onClick={this.generateEventList}>GENERATE CHART</button>
          </footer>   

      </div>
    );
  }

  generateEventList(){
    try{
      /* 
      string parse, and construction encapsulated in a new object due to 
      the incompatibility of JSON.parse with the object pattern of the challenge.
      More details on ChartEventList.js
      */
      let newChartEventList = new ChartEventList(this.state.eventsText);
      this.setState({chartEventList: newChartEventList});
    }catch (err){
      console.log(err);
      alert(err.message);   
    }
  }
}

export default App;
