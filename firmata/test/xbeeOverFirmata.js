/** * Created by root on 16/12/14. */
var firmata=require("../lib/firmata");
var board=new firmata.Board("/dev/ttyUSB0", function(err){
    if (err){
        console.log("Init error");
        return;
    }

    console.log("Firmware: " + board.firmware.name + "-" + board.firmware.version.major + "." + board.firmware.version.minor);

    //board.reset();

    setTimeout(function(){
        board.setSamplingInterval(100);

    },500);

    setTimeout(function(){
        board.setFirmataTime();

    },700);



    setTimeout(function(){
        board.setDeliveryInterval(1000,  function(value) {  //65535 reset to streaming mode
            console.log("samples-packet in front", value);
        });
    },900);


    setTimeout(function(){
    board.pinMode(3, board.MODES.ANALOG);
    }, 1100);

    /*setTimeout(function(){
        board.pinMode(5, board.MODES.ANALOG);
    }, 1200);
    setTimeout(function(){
        board.pinMode(4, board.MODES.ANALOG);
    }, 1300);*/

    /*setTimeout(function(){
        board.pinMode(6, board.MODES.INPUT);
    }, 1400);*/



    setTimeout(function(){
       board.analogRead(3, function(data){
            console.log("Reading analog:   ", data);
        });
    },1500);

   /* setTimeout(function(){
        board.analogRead(5, function(data){
            console.log("Reading analog:   ", data);
        });
    },1600);

    setTimeout(function(){
        board.analogRead(4, function(data){
            console.log("Reading analog:   ", data);
        });
    },1700);*/

    /*setTimeout(function(){
        board.digitalRead(6, function(data){
            console.log("Reading analog:   ", data);
        });
    },1800);*/




  /*
   setTimeout(function(){
  board.pinMode(5, board.MODES.ANALOG);
   }, 500);
   setTimeout(function(){
   board.pinMode(6, board.MODES.ANALOG);
   },700);
    setTimeout(function(){
        board.analogRead(5, function(data){
            console.log("Reading analog:   ", data);
        });
   },1100);
    setTimeout(function(){
        board.analogRead(6, function(data){
            console.log("Reading analog:   ", data);
        });
    },1300);

    setTimeout(function(){
    board.pinMode(3, board.MODES.INPUT);
    },1500);

    setTimeout(function(){
        board.pinMode(4, board.MODES.INPUT);
    },1700);
    setTimeout(function(){
        board.pinMode(5, board.MODES.INPUT);
    },1900);
    setTimeout(function(){
        board.digitalRead(3, function(data){
            console.log("digital read in front: ", data);
        })
    },2100);
    setTimeout(function(){
        board.digitalRead(4, function(data){
            console.log("digital read in front: ", data);
        })
    },2300);

    setTimeout(function(){
        board.digitalRead(5, function(data){
            console.log("digital read in front: ", data);
        })
    },2500);*/




    board.on("string", function(string){
        console.log(string)
    });

    board.on("int-data", function(number){
        console.log(number)
    });

});
