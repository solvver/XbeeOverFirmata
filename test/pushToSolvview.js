/**
 * Created by root on 17/02/15.
 */
var firmata=require("../firmata");
var https = require('http');
var url=require("url");
var options = {
    hostname: 'pre.solvview.com',
    //hostname: '54.246.122.160',
   // port: 443,
   // path: '/api/back/post/channels',
    port: 3000,
    path: '/post/channels',
    method: 'POST',
    headers:{
        authentication:'{"uuid":"daq_ohlconcesiones_1","token":"RJ3FokddHWN7izYs"}'
    }
};
//options.hostname='nidays.solvview.com';
options.hostname='pre.solvview.com';

//options=url.parse("https://pre.solvview.com/api/back/post/channels");
options.headers={
    authentication:'{"uuid":"daq_ohlconcesiones_1","token":"RJ3FokddHWN7izYs"}',
    "Content-Type": "application/json"
};

var now = new Date();

function buildSolvviewDataFrame() {
    var dataframe = {
        h: {mId: "arturete"},
        b: {
            m: {
                id: "2_3_1", sP: 100, sC: 10, ts: now.getTime()
            }, y: []
        },
        t: now
    }
    return dataframe;
};
var contReq=0;
var dataframe;
var board=new firmata.Board("/dev/ttyUSB0", function(err){
    if (err){
        console.log("Init error");
        return;
    }
    console.log("Firmware: " + board.firmware.name + "-" + board.firmware.version.major + "." + board.firmware.version.minor);
    board.reset();
    setTimeout(function(){
    board.setSamplingInterval(100);
    board.setFirmataTime();
    board.setDeliveryInterval(1000,  function(data){
        contReq++;
        dataframe = buildSolvviewDataFrame();
        dataframe.b.m.ts = (data.TS);
         dataframe.t= new Date (data.TS);
        for(var i=0;i<data.SC;i++) {
            dataframe.b.y[i] = data.samples[i];
        }
        sendCloud(dataframe);
     });

    setTimeout(function(){
    board.pinMode(3, board.MODES.ANALOG);
    board.analogRead(3, function(data){
        console.log("Reading analog:   ", data);
    });
    }, 2000);
    }, 1500);

    board.on("errorTx", function(data){
        console.log("ArduinoErrorTx");
        console.log(data.errorCode);
        console.log(data.errorT);
    })

});

function sendCloud(dataframe){
        var req = https.request(options, function (res) {

      //  console.log("statusCode: ", res.statusCode, dataframe.t);
        //console.log("headers: ", res.headers);
        if(res.statusCode != 200) {
            console.log("statusCode != 200", res.statusCode);
        }
        res.on("data",function(chunk){
        });


    });
    req.setTimeout(10000,function(){
        console.log("Timeout occurs to frame ", dataframe.t);
        req.write(JSON.stringify(dataframe));
    })
    req.on('error', function (e) {
        console.log("contReq:  ", contReq)
        console.error('REQ error', e);
        console.log(dataframe.b.y);
        console.log(dataframe.t);
        req.write(JSON.stringify(dataframe));
    });
    req.on("close",function(){
      //  console.log("Connection closed", dataframe.t);
    })

    req.write(JSON.stringify(dataframe),function(){
       // console.log("request write", dataframe.t);
    });
    req.end();


}