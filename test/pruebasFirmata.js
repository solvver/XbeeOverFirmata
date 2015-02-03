/**
 * Created by root on 20/01/15.
 */

xbee = require("../node_modules/xbee-api/lib/xbee-api.js")

var SerialPort = require('../node_modules/firmata/node_modules/serialport').SerialPort;

var xbeeAPI = new xbee.XBeeAPI({
    api_mode: 1
});

var serialport = new SerialPort("/dev/ttyUSB0", {baudRate: 57600,
                    bufferSize: 120,
                    databits: 8
                    },
                    undefined, function(err) {
                         if (err) console.log("error open serialPort");
                        serialport.write(xbeeAPI.buildFrame(newFrame), function (err) {
                            if (err) console.log("error writing", err);
                        });
                });


var newFrame = {    //añadido por arturo 17-12-2014   16:54
    type: 0x00, // xbee_api.constants.FRAME_TYPE.TX_REQUEST_64
    id: 0x52, // optional, nextFrameId() is called per default
    destination64: "0013A200406FB3A1",
    options: 0x00, // optional, 0x00 is default
    data: 0xf9
};

    /*serialport.open( function(err) {
        if (err) console.log("error opening", err);

        serialport.write(xbeeAPI.buildFrame(newFrame), function (err) {
            if (err) console.log("error writing", err);
        });

    });*/

    /*setInterval(function(){serialport.write(xbeeAPI.buildFrame(newFrame), function (err) {
        if (err) console.log("error writing", err);
    })

    }, 2000);*/




    serialport.on("data", function (data) {
        console.log("datos recobidos==>", data);
    });