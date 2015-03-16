/** * Created by root on 16/12/14. */
var firmata=require("../lib/firmata");
var board=new firmata.Board("/dev/ttyUSB0", function(err){
    if (err){
        console.log("Init error");
        return;
    }

    console.log("Firmware: " + board.firmware.name + "-" + board.firmware.version.major + "." + board.firmware.version.minor);

  //  board.reset();

    setTimeout(function(){

    board.setSamplingInterval(100);

    board.setFirmataTime();

    board.setDeliveryInterval(1000,  function(value) {  //65535 reset to streaming mode
            console.log("samples-packet in front", value);
        });

    setTimeout(function(){
        board.pinMode(2, board.MODES.INPUT);
        board.pinMode(3, board.MODES.INPUT);
        board.pinMode(42, board.MODES.INPUT);
        board.pinMode(21, board.MODES.INPUT);
        /*board.pinMode(32, board.MODES.INPUT);*/
   // board.pinMode(5, board.MODES.ANALOG);
  /*  board.pinMode(6, board.MODES.ANALOG);
    board.pinMode(7, board.MODES.ANALOG);
    board.pinMode(8, board.MODES.ANALOG);
    board.pinMode(9, board.MODES.ANALOG);
         board.pinMode(10, board.MODES.ANALOG);*/
   /* board.pinMode(11, board.MODES.ANALOG);
    board.pinMode(12, board.MODES.ANALOG);
        board.pinMode(0, board.MODES.ANALOG);
        board.pinMode(1, board.MODES.ANALOG);
        board.pinMode(2, board.MODES.ANALOG);
        board.pinMode(3, board.MODES.ANALOG);
        board.pinMode(4, board.MODES.ANALOG);
        board.pinMode(5, board.MODES.ANALOG);
        board.pinMode(13, board.MODES.ANALOG);*/
   /* board.pinMode(13, board.MODES.ANALOG);
    board.pinMode(14, board.MODES.ANALOG);
    board.analogRead(3, function(data){
        console.log("Reading analog:   ", data);
    });
    board.analogRead(5, function(data){
        console.log("Reading analog:   ", data);
    });*/
    /*board.analogRead(6, function(data){
        console.log("Reading analog:   ", data);
    });
    board.analogRead(7, function(data){
        console.log("Reading analog:   ", data);
    });
    board.analogRead(8, function(data){
        console.log("Reading analog:   ", data);
    });
    board.analogRead(9, function(data){
        console.log("Reading analog:   ", data);
    });
         board.analogRead(10, function(data){
        console.log("Reading analog:   ", data);
    });*/
    /*board.analogRead(11, function(data){
        console.log("Reading analog:   ", data);
    });
    board.analogRead(12, function(data){
        console.log("Reading analog:   ", data);
    });
        board.analogRead(0, function(data){
            console.log("Reading analog:   ", data);
        });
        board.analogRead(1, function(data){
            console.log("Reading analog:   ", data);
        });
        board.analogRead(2, function(data){
            console.log("Reading analog:   ", data);
        });
        board.analogRead(3, function(data){
            console.log("Reading analog:   ", data);
        });
        board.analogRead(4, function(data){
            console.log("Reading analog:   ", data);
        });
        board.analogRead(5, function(data){
            console.log("Reading analog:   ", data);
        });
        board.analogRead(13, function(data){
            console.log("Reading analog:   ", data);
        });*/
  /*  board.analogRead(13, function(data){
        console.log("Reading analog:   ", data);
    });*/
    board.digitalRead(2, function(data){
              console.log("Reading digital:   ", data);
    });
        board.digitalRead(3, function(data){
            console.log("Reading digital:   ", data);
        });
        board.digitalRead(42, function(data){
            console.log("Reading digital:   ", data);
        });
         /* board.digitalRead(21, function(data){
            console.log("Reading digital:   ", data);
        });*/
        board.digitalRead(32, function(data){
            console.log("Reading digital:   ", data);
        });
    }, 2000);




    }, 1500);


    board.on("string", function(string){
        console.log(string)
    });

    board.on("int-data", function(number){
        console.log(number)
    });

});

