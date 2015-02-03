/** * Created by root on 16/12/14. */
var firmata=require("../lib/firmata");
var board=new firmata.Board("/dev/ttyUSB0", function(err){
    if (err){
        console.log("Init error");
        return;
    }

    console.log("Firmware: " + board.firmware.name + "-" + board.firmware.version.major + "." + board.firmware.version.minor);

    board.setSamplingInterval(1000);

    board.setDeliveryInterval(3000);

   setTimeout(function(){
       board.pinMode(22, board.MODES.OUTPUT);
       board.pinMode(53, board.MODES.OUTPUT);
       board.pinMode(3, board.MODES.ANALOG);
   },1000);

    setTimeout(function(){
        board.analogRead(3, function(data){
            console.log("Reading digital:   ", data);
        });
    },1000);

});
