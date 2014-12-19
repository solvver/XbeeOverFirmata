/**
 * Created by root on 22/08/14.
 */

var SerialPort = require('serialport').SerialPort;
var xbee_api = require('../node_modules/xbee-api/lib/xbee-api.js');



var xbeeAPI = new xbee_api.XBeeAPI({
    api_mode: 1
});

var serialport = new SerialPort("/dev/ttyUSB0", {
    baudrate: 9600
    //, parser: xbeeAPI.rawParser()
});

serialport.on("data",function(data){
    console.log("data ",data.toString("HEX"));
});

serialport.on("open", function() {
    console.log("OPCIONES:" +
        "1.-Única medida" +
        "2.-Varias medidas" +
        "3.-Enviar comando AT");
   });


xbeeAPI.on("frame_object", function(frame) {
    console.log("OBJ> "+util.inspect(frame));
});
