var util = require('util');
var SerialPort = require('serialport').SerialPort;
var xbee_api = require('xbee-api');

var C = xbee_api.constants;

var xbeeAPI = new xbee_api.XBeeAPI({
    api_mode: 1
});

var serialport = new SerialPort("COM7", {
    baudrate: 9600,
    parser: xbeeAPI.rawParser()
});

serialport.on("open", function() {
    var frame_obj = { // AT Request to be sent to
        type: C.FRAME_TYPE.AT_COMMAND,
        command: "NI",
        commandParameter: [],
    };



// All frames parsed by the XBee will be emitted here
xbeeAPI.on("frame_object", function(frame) {
    console.log(">>", frame);
});
var frameId = xbeeAPI.nextFrameId();
var frame_obj = {
    type: C.FRAME_TYPE.AT_COMMAND,
    id: frameId,
    command: "NI",
    commandParameter: []
};



// All frames parsed by the XBee will be emitted here
xbeeAPI.on("frame_object", function(frame) {
    if (frame.id == frameId &&
        frame.type == C.FRAME_TYPE.AT_COMMAND_RESPONSE) {
        // This frame is definitely the response!
        console.log("Node identifier:",
            String.fromCharCode(frame.commandData));
    } else {
        // This is some other frame
    }
});/**
 * Created by sergio on 07/07/2014.
 */
