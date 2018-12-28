import React, { Component } from "react";
import {UnControlled as CodeMirror} from 'react-codemirror2';
import Resizable from 're-resizable';
require('codemirror/mode/javascript/javascript');

export default class ResizableTextEditor extends Component {
    constructor(){
        super();
        this.state = {
            code: '',
            height: 230 /* the same value defined for the height of codemirror in codemirror.css */
        }
        this.myCodeMirror = undefined;
    }

    setHeight(value){
        this.setState({height: value});
        this.myCodeMirror.setSize(null, value);
        this.myCodeMirror.changeGeneration();
    }

    setCode(value){
        this.setState({code: value});
        this.props.updateExternalModel(value);
    }
    componentDidMount(){
        this.initExampleCode();
    }

    initExampleCode(){
        this.setCode( 
`/* TO RESIZE THE CODE AREA, SCROLL AT THA LAST LINE AND THE CURSOR WILL CHANGE TO THE RESIZE CURSOR */
// A expansion of the example, just for tests.
{type: 'start', timestamp: 1519862400000, select: ['min_response_time', 'max_response_time'], group:['os', 'browser']}
{type: 'span', timestamp: 1519862400000, begin: 1519862400000, end: 1519862520000}//range expanding
{type: 'data', timestamp: 1519862400000, os: 'linux', browser: 'chrome', min_response_time: 0.1, max_response_time: 1.3}
{type: 'data', timestamp: 1519862400000, os: 'mac', browser: 'chrome', min_response_time: 0.2, max_response_time: 1.2}
{type: 'data', timestamp: 1519862400000, os: 'mac', browser: 'firefox', min_response_time: 0.3, max_response_time: 1.2}
{type: 'data', timestamp: 1519862400000, os: 'linux', browser: 'firefox', min_response_time: 0.1, max_response_time: 1.0}
{type: 'data', timestamp: 1519862460000, os: 'linux', browser: 'chrome', min_response_time: 0.2, max_response_time: 0.9}
{type: 'data', timestamp: 1519862460000, os: 'mac', browser: 'chrome', min_response_time: 0.1, max_response_time: 1.0}
{type: 'data', timestamp: 1519862460000, os: 'mac', browser: 'firefox', min_response_time: 0.2, max_response_time: 1.1}
{type: 'data', timestamp: 1519862460000, os: 'linux', browser: 'firefox', min_response_time: 0.3, max_response_time: 1.4}
{type: 'data', timestamp: 1519862490000, os: 'linux', browser: 'firefox', min_response_time: 0.5, max_response_time: 1.6}//new line
{type: 'stop', timestamp: 1519862520000}//range expanding`);
    }
    render() {
        return (
            <div>
                <Resizable //The logic to resize the CodeMirror component comunicating their events with the Resizable component events
                    size={{height:this.state.height}}
                    enable={{bottom: true}}
                    onResize={(e, direction, ref, d)  => {
                        this.myCodeMirror.setSize(null, this.state.height + d.height);
                        if(d.height > 0)
                            window.scroll(0, this.state.height + d.height);
                        this.myCodeMirror.changeGeneration();
                    }}
                    onResizeStop={(e, direction, ref, d) => {
                        this.setHeight(this.state.height + d.height);
                    }}
                >
                        <CodeMirror
                            value={this.state.code}
                            onChange={(editor, data, value) => {
                                this.props.updateExternalModel(value);
                            }}
                            editorDidMount={(editor) => this.myCodeMirror = editor}
                            options={{
                                lineNumbers: true,
                                mode: "javascript",
                                theme: "lucario",
                                autoSave: true
                            }}
                        />
                </Resizable>
            </div>
        );
    }
}
