var util = require('util');
var SerialPort = require('serialport').SerialPort;
var xbee_api = require('xbee-api');

var C = xbee_api.constants;

var xbeeAPI = new xbee_api.XBeeAPI({
    api_mode: 1
});



var serialport = new SerialPort("/dev/ttyUSB0", {
    baudrate: 9600,
     parser: xbeeAPI.rawParser()
});

serialport.on('data',function(data){
    console.log("data recibido", data.toString("utf8"));
});

serialport.on('open', function() {
    console.log("PPPPPSerial port open... sending ATND");
    var frame = {
//        mode: UNICAST,
        MY_known: 0xFFFF,
        packetID: 0x52,
        destination64: "13A200406FB3A1",
        options: 0x00, // optional, 0x00 is default
        data: "TxData0A" // Can either be string or byte array.
    };

    xbeeAPI.on('data', function (data) {
        console.log("data xbee", data.toString("utf8"));
    });

    /*serialport.write(xbeeAPI.buildFrame(frame), function(err, res) {
     if (err) throw(err);
     else     console.log("written bytes: "+util.inspect(res));
     });*/

});

//xbeeAPI.on("frame_object", function(frame) {
//console.log("OBJ> "+util.inspect(frame));
//});
