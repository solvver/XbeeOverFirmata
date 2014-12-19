/**
 * Created by solvver on 15/07/14.
 */
var SerialPort = require('serialport').SerialPort;
var xbee_api = require('xbee-api');


//--------------DECLARACIONES--------------


var Xbee = new xbee_api.XBeeAPI();


//console.log("Xbee parser", Xbee._frame_parser)
//var buffer=new Buffer("123");

/*Xbee._frame_parser["123"]=function(buffer){
    console.log("hola")
}*/

//Xbee.parseFrame(buffer)
//var addParser=require("./ParserWaspmote").addParser;
//Xbee= addParser(Xbee)

var serialport= new SerialPort ("/dev/ttyUSB0", {
    baudrate: 9600
    //,parser: Xbee.myParser()
});

//var dataRX;


//---------------EVENTOS---------------------

serialport.on("open", function(){
    console.log("Ábrete Sésamo y se abrió");
    //var frame = 0x123456789;Xbee.myBuildFrame(frame),
    /*serialport.write("Hola", function() {
    console.log("hola");
    });*/
    //var aux;
    //aux=Xbee.myBuildFrame();
    //serialport.write(aux, function () {
    //        console.log("sending");
    //   });
    //console.log("aux:", aux);
});
var counter=0;

    serialport.on("data", function (data) {
        counter += data.length;
         console.log("---------------------------------------");
         console.log("data recibido", data.toString("HEX"),data.toString("utf8"), "dataLength:" ,data.length, "acum", counter);
        Xbee.mySecondParser(data);

    });


    /*setInterval(function () {
        console.log("sending");
        serialport.write(Xbee.myBuildFrame(), function () {

        });

    }, 3000);*/
