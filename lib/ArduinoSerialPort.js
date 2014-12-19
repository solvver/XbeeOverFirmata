var SerialPort=require("serialport").SerialPort;

var portSettings = {
    baudrate: 38400,
    parity: "none",
    databits: 8,
    stopbits: 1,
    flowControl: false,
    bufferSize: 20
};

var port = new SerialPort("COM3",portSettings,function(err) {
    if(err) {
        console.log("Error connecting with serial port",err);

        return;
    }

    console.log("COM3","port open");
});
port.on("data",function(data){


    console.log("Valores medidos:",data.toString("utf8"));
})


