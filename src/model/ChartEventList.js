//this error dispatcher only encapsulates a throw new Error and console.log of an object/message in one call
import ErrorDispatcher from '../services/ErrorDispatcher';

/*
    This file and classes were created for the purpose of convert 
    the events entered by the user in a form of string for a JavaScript Object.

    The first, and obivious, approach was to use the JSON.parse function,
    but due to the fields names and values haven't wrapped into double quotes the parse fails.

    So my chose approach was to construct a parser class.

    Then, due to the complex and varied struct of events, the creational pattern builder,
    was chose to create the list of events based on the string events entered.

    The builder class isn't exported, so it can't be externally accessed except 
    by the constructor of ChartEventList. Moreover, the functions that extract 
    each event type (using a specific Regular Expression, based on the construction instruction) 
    weren't introduced directly in the builder class so it can't be naively accessed 
    and even if the code was altered and the functions exported, they will not affect 
    the correct execution of the build method
*/

const bkLine = '\n';

/* type and timestamp fields */
function extractBasicFields(stringEvent){
    let regex = /type\s*:\s*'(\w*)'\s*,\s*timestamp\s*:\s*(\d+)\s*/i;
    let regexResult = regex.exec(stringEvent);
    if(regexResult){
        return {
            type: regexResult[1],
            timestamp: Number.parseInt(regexResult[2])
        }
    }
    return undefined;
}

/* 
I think that there is no sense to plot a graphic without the field name.
So I require that the select field be present. At least a field name, even if it's an empty field.

the group value continues optional.
*/
function buildChartEventStart(stringEvent, eventBasic){
    let regexSelect = /select\s*:\s*(\['\w*'(\s*,\s*'\w+')*\])\s*(,|}$)/i
    let regexGroup = /group\s*:\s*(\['\w*'(\s*,\s*'\w+')*\])\s*(,|}$)/i
    
    let regexSelectResult = regexSelect.exec(stringEvent);
    if(regexSelectResult)
        eventBasic.select = JSON.parse(regexSelectResult[1].replace(/[']/g, '"'));
    else
        return undefined;

    let regexGroupResult = regexGroup.exec(stringEvent);
    if(regexGroupResult)
        eventBasic.group = JSON.parse(regexGroupResult[1].replace(/[']/g, '"'));
    
    return eventBasic;

}

/* 
Simple timestamps getting in the fields begin and end

Only one between the two are required, because there's no sense to have 
a span event without another information except timestamp and type
*/
function buildChartEventSpan(stringEvent, eventBasic){
    let beginOrEndFind = false;
    let regexBegin = /begin\s*:\s*(\d+)\s*/i;
    let regexEnd = /end\s*:\s*(\d+)\s*/i;

    let regexBeginResult = regexBegin.exec(stringEvent);
    if(regexBeginResult){
        eventBasic.begin = Number.parseInt(regexBeginResult[1]);
        beginOrEndFind = true;
    }

    let regexEndResult = regexEnd.exec(stringEvent);
    if(regexEndResult){
        eventBasic.end = Number.parseInt(regexEndResult[1]);
        beginOrEndFind = true;
    }

    if(beginOrEndFind)
        return eventBasic;
    else
        return undefined;
}

/* 
the data event requires that a start event has already been constructed

and there's no sense to have a data event without any data, so at least one is required

groups continues optional
*/
function buildChartEventData(stringEvent, eventBasic, selectArray, groupArray){
    let lessOneValueFind = false;

    selectArray.forEach(variable => {
        let regex = new RegExp(`${variable}\\s*:\\s*((\\d+\\.\\d+)|(\\d+))\\s*`, 'i');
        let regexResult = regex.exec(stringEvent);
        if(regexResult){
            eventBasic[variable] = Number.parseFloat(regexResult[1]);
            lessOneValueFind = true;
        }
    });

    if(!lessOneValueFind)
        return undefined;
    
    if(groupArray){
        groupArray.forEach(g => {
            let regex = new RegExp(`${g}\\s*:\\s*('(\\w*)'|(undefined))\\s*`, 'i');
            let regexResult = regex.exec(stringEvent);
            if(regexResult){
                if(regexResult[1] === "undefined")
                    eventBasic[g] = undefined;
                else
                    eventBasic[g] = regexResult[1].replace(/[']/g, "");
            }
        });
    }

    return eventBasic;
}

/* 
This is the object builder which implements the Builder Pattern to construct the ChartEventList using the functions above
*/
class ChartEventListBuilder{
    constructor(){
        throw new Error("Cannot instantiate the class ChartEventListBuilder because it's static class");
    }

    static build(stringWithManyEvents){
        stringWithManyEvents = stringWithManyEvents.replace(/\/\*.*\*\//g, ""); //to remove multiline comments in the coding text
        stringWithManyEvents = stringWithManyEvents.replace(/\/\/.*/g, ""); //to remove inline comments in the coding text
        //the comments can leave aditional breaklines. So, for ignore it this filter for removing empty strings
        let stringEventsArray = stringWithManyEvents.split(bkLine).filter(s => s.trim() !== ""); 
        let chartEventArray = [];
        
        stringEventsArray.forEach((stringEvent, index)=> {
            let eventBasic = extractBasicFields(stringEvent);
            let eventChart = undefined;
            let lineNumber = index + 1;
            if(eventBasic){
                switch(eventBasic.type){
                    case "start":
                        eventChart = buildChartEventStart(stringEvent, eventBasic);
                        if(eventChart)
                            chartEventArray = [eventChart];//either was the first event or must ignore other previous events
                        else{
                            ErrorDispatcher.errorDispatch(
                                `Cannot create the ChartEventList because the event of type start in the line ${lineNumber} doesn't follow the right syntax`,
                                stringEvent
                            );
                            /*
                                seeing that the fields may be absent, the only restriction 
                                in the construction of the start event would be 
                                at least having the select array for the names of data event fields.
                                The absence of group array can be allowed
                            */
                            return;
                        }
                        break;
                    case "span":
                        eventChart = buildChartEventSpan(stringEvent, eventBasic);
                        if(eventChart)
                            chartEventArray.push(eventChart);
                        else{
                            ErrorDispatcher.errorDispatch(
                                `Cannot create the ChartEventList because the event of type span in the line ${lineNumber} doesn't follow the right syntax`,
                                stringEvent
                            );
                            //throws error if and only if the span event has both, begin and end, fields absent
                            return;
                        }
                        break;
                    case "stop":
                        //the stop event hasn't additional fields, so it can be added at the basic form
                        chartEventArray.push(eventBasic);
                        break;
                    case "data":
                        //this search for start event was explained in the buildChartEventData function
                        let chartEventStart = chartEventArray.find(chartEvent => chartEvent.type.toLowerCase() === 'start');
                        if(chartEventStart){
                            eventChart = buildChartEventData(stringEvent, eventBasic, chartEventStart.select, chartEventStart.group);
                            if(eventChart)
                                chartEventArray.push(eventChart);
                            else
                                ErrorDispatcher.errorDispatch(
                                    `Cannot create the ChartEventList because the event of type data in the line ${lineNumber} doesn't have any field defined in the property select of start event`,
                                    stringEvent
                                );
                                /*
                                seeing that the fields may be absent, the only restriction 
                                in the construction of the data event would be at least
                                having a select value to plot in the chart
                                */
                               return;
                        }else{
                            console.log(stringEvent);
                            console.log("data event above ignored by missing start event");
                            /*
                            if a data event came before a start event, the data event will be ignored, 
                            and the construction will follow so it doesn't throw an error
                            */
                        }
                        break;
                    default:
                        /* unknown type */
                        console.log(eventBasic);
                        ErrorDispatcher.errorDispatch(
                            `Cannot create the ChartEventList, because the event on line ${lineNumber} has an unknown type`,
                            stringEvent
                        );
                        return;
                }
            }
            else{
                /* can't extract basic event data (type and timestamp) */
                ErrorDispatcher.errorDispatch(
                    `Cannot create the ChartEventList, because the event on line ${lineNumber} doesn't follow the right syntax`,
                    stringEvent
                );
                return;
            }
        });

        return chartEventArray;
    }
}

/* 
The class below is the exported class and the object that is passed by App.js and ChartComponent.js
Also the owner of the data that generates it and knows the build and parse process necessary for the application

A static property count that generates a unique id for the objects.
This approach was chosen with the purpose to differentiate each interaction of the "GENERATE CHART" in App.js
which avoids the infinite loop update btween App.js and ChartComponent.js

Each interaction with the "GENERATE CHART" button on App.js creates a new ChartEventList, but if the content is the same, 
use JSON.stringlify to compare is incorrect and doesn't generate the appropriate response of event, so the id was the answer to solve it.
*/
export default class ChartEventList{
    constructor(stringWithManyEvents){
        this.chartEventArray = ChartEventListBuilder.build(stringWithManyEvents);
        this.chartDataObjectArray = undefined;
        ChartEventList.prototype.count = ChartEventList.prototype.count === undefined ? 0 : ChartEventList.prototype.count + 1;
        this.id = ChartEventList.prototype.count;
    }

    /* function that maps the created list to be used by the plot component 
    to a specific object list for ReactHighCharts 
    
    This approach tries to isolate the construction of specifc domain data
    to the usage data for a specific component, facilitating the change of components
    */
    getHighChartsChartDataList(){
        var groupedDataList = this.getDataGroupedByLabelList();
        if(groupedDataList)
            return groupedDataList.map(gd => {
                return {
                    name: gd.label,
                    data: gd.data
                };
            });
        return groupedDataList;
    }

    /*
    function that interprets the sequence of events and constructs the necessary data for the chart.

    this method stores the generated list of objects, and return it if it's already constructed.
    it's useful if we consider that the function is called by the component update of ChartComponent
    */
    getDataGroupedByLabelList(){
        if(this.chartDataObjectArray)
            return this.chartDataObjectArray;
        
        //crescent sort of timestamp
        this.chartEventArray.sort((ce1, ce2) => ce1.timestamp - ce2.timestamp);

        let idxStart = this.chartEventArray.findIndex(chartEvent => chartEvent.type.toLowerCase() === 'start');

        if(idxStart === -1) //Cannot create the ChartDataList, because the event of type start is not present
            return undefined;

        let startEvent = this.chartEventArray[idxStart];
        let result = [];
        let rangeStart = undefined;
        let rangeEnd = undefined;

        /*
            this solution assumes that the span event can be placed and removed to modify the chart
            in order to be able to count the data inside the delimited timestamp (begin - end) even 
            if it is a data event with timestamp value before the timestamp value of span event
        */
        if(this.chartEventArray.find(eventChart => eventChart.type.toLowerCase() === 'span')){
            let lastSpanEvent = this.chartEventArray
                                .filter(eventChart => eventChart.type.toLowerCase() === 'span')
                                .sort((sp1, sp2) => sp2.timestamp - sp1.timestamp)[0]; //timestamp decrescent ordering

            rangeStart = lastSpanEvent.begin;
            rangeEnd = lastSpanEvent.end;
        }

        let stopEvent = this.chartEventArray.find(eventChart => eventChart.type.toLowerCase() === 'stop');
        if(stopEvent){
            if(rangeEnd) //if stop event and span event are present, the smaller range is considered
                rangeEnd = rangeEnd < stopEvent.timestamp ? rangeEnd : stopEvent.timestamp;
            else
                rangeEnd = stopEvent.timestamp;
        }
        
        this.chartEventArray.forEach((chartEvent, i) => {
            if(i > idxStart){//only data event after a start event will be considered
                if(chartEvent.type.toLowerCase() === 'data'){
                    if( (!rangeStart || chartEvent.timestamp >= rangeStart) &&
                        (!rangeEnd || chartEvent.timestamp <= rangeEnd)
                    ){
                        let stringLabel = ""
                        if(startEvent.group){//constructing grouping label
                            startEvent.group
                                .forEach(g => stringLabel += chartEvent[g] ? chartEvent[g] + " " : "")
                        }

                        startEvent
                            .select
                            .map(field => {
                                let label = undefined;
                                if(chartEvent[field]){
                                    label = stringLabel + field; //grouping label combined with each field to create a new line in the chart
                                }
                                return {
                                    label: label,
                                    data: [(chartEvent.timestamp - rangeStart)/60000, chartEvent[field]] 
                                    //returning also the milisec timestamp of each ploted point, to be the X value
                                };
                            })
                            .forEach((chartData) => {
                                if(chartData.label !== undefined){
                                    //grouping the data by label, to make a line correspondent to the label
                                    let resultChartData = result.find(resultChartData => resultChartData.label === chartData.label);
                                    if(!resultChartData){
                                        resultChartData = {
                                            label: chartData.label, 
                                            data: []
                                        };
                                        result.push(resultChartData);
                                    }
                                    
                                    resultChartData.data.push(chartData.data);//reference by the object, will be altered inside the list too.
                                }
                            });

                    }
                }
                    
            }
        });
        return result;
    }
}