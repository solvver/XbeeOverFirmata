/** * Created by root on 16/12/14. */
var firmata=require("../lib/firmata");
var board=new firmata.Board("/dev/ttyUSB0", function(err){
    if (err){
        console.log("Init error");
        return;
    }

    console.log("Firmware: " + board.firmware.name + "-" + board.firmware.version.major + "." + board.firmware.version.minor);

    //board.reset();

    //setTimeout(function(){
        board.setSamplingInterval(100);
        board.on("repeatTx"+5, function(){
            board.setSamplingInterval(1000)
        });
    //},500);

    //setTimeout(function(){
        board.setFirmataTime();
        board.on("repeatTx"+6, function(){
            board.setFirmataTime()
        });
    //},700);


    var contador=0;
//    setTimeout(function(){
        board.setDeliveryInterval(1000,  function(value){  //65535 reset to streaming mode
            console.log("samples-packet in front", value);
            console.log("contador  :", contador);
            contador++;
            if (contador==9) contador=0;
             });
        board.on("repeatTx"+7, function(){
            board.setDeliveryInterval(3000,  function(value){  //65535 reset to streaming mode
                console.log("samples-packet in front", value);
            })
        });
  //  },1100);


    setTimeout(function(){
    board.pinMode(3, board.MODES.ANALOG);
    board.on("repeatTx"+8,  function(){
        board.pinMode(3, board.MODES.ANALOG);
    })
    }, 100);


    setTimeout(function(){
       board.analogRead(3, function(data){
            console.log("Reading analog:   ", data);
        });
        board.on("repeatTx"+9, function(){
            board.analogRead(3, function(data){
                console.log("Reading analog:   ", data);
            });
        })
    },300);
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
