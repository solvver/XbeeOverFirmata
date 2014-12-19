/**
 * Created by sergio on 04/07/2014.
 */
var util = require('util');
var SerialPort = require('serialport').SerialPort;
var xbee_api = require('xbee-api');

var C = xbee_api.constants;

var xbeeAPI = new xbee_api.XBeeAPI({
    api_mode: 1
});



var serialport = new SerialPort('/dev/ttyUSB0', {
    baudrate: 54000
    //parser: xbeeAPI.rawParser()
});

serialport.on("data",function(data){
    console.log("data ",data.toString("utf8"));
});


serialport.on("open", function() {
    console.log("Serial port open... sending ATND");
    };

    serialport.write("HOLA QUE ASE", function(err, res) {
       if (err) console.log("error");// throw(err);
       else     console.log("written bytes: "+util.inspect(res));
    });
});


//xbeeAPI.on("frame_object", function(frame) {
    //console.log("OBJ> "+util.inspect(frame));
//});
