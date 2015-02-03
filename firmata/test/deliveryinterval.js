/**
 * Created by root on 3/02/15.
 */
var firmata=require("../lib/firmata");
var board=new firmata.Board("/dev/ttyUSB0", function(err){
    if (err){
        console.log("Init error");
        return;
    }

    console.log("Firmware: " + board.firmware.name + "-" + board.firmware.version.major + "." + board.firmware.version.minor);

    //board.setSamplingInterval(1000);

    board.setDeliveryInterval(65535);

    // board.pinMode(3, board.MODES.ANALOG);


    //   board.analogRead(3, function(data){
    //     console.log("Reading digital:   ", data);
    // });
});