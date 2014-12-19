/**
 * Created by root on 22/08/14.
 */
var util = require('util');
var SerialPort = require('serialport').SerialPort;
var xbee_api = require('../node_modules/xbee-api/lib/xbee-api.js');

var C = xbee_api.constants;

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
    console.log("Serial port open... sending ATND");
    var frame ={
        type: 0x00, // xbee_api.constants.FRAME_TYPE.TX_REQUEST_64
        id: 0x52, // optional, nextFrameId() is called per default
        destination64: "0013A200406FB3AE",
        options: 0x00, // optional, 0x00 is default
        data: "read" // Can either be string or byte array.
        /*type: 0x80, // xbee_api.constants.FRAME_TYPE.RX_PACKET_64
        remote64: "0013A20040B32B58",
        rssi: 0x3f,TxData0A
        receiveOptions: 0x01,
        data: [ 0x52, 0x78, 0x44, 0x61, 0x74, 0x61 ]*/
    };

    var aux=xbeeAPI.buildFrame(frame);

    serialport.write(aux, function(err, res) {
        if (err) throw(err);
        else     console.log("written bytes: "+util.inspect(res), aux.toString("HEX"));
    });
});


xbeeAPI.on("frame_object", function(frame) {
    console.log("OBJ> "+util.inspect(frame));
});
