export default class ErrorDispatcher{
    constructor(){
        throw new Error("Cannot instantiate the class ErrorDispatcher because it's static class");
    }

    static errorDispatch(message, infoLog){
        if(infoLog) console.log(infoLog);
        if(message) throw new Error(message);
    }
}