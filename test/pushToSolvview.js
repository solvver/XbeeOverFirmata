/**
 * Created by root on 17/02/15.
 */
var firmata=require("../firmata");
var https = require('https');
var url=require("url");
var options = {
    hostname: 'pre.solvview.com',
    port: 443,
    path: '/api/back/post/channels',
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

    board.setDeliveryInterval(1000,  function(data){  //65535 reset to streaming mode
        //console.log("#################", cont, "#################");
        dataframe = buildSolvviewDataFrame();
        dataframe.b.m.ts = (data.TS);
         dataframe.t= new Date (data.TS);
        for(var i=0;i<data.SC;i++) {
            dataframe.b.y[i] = data.samples[i];
        }


            var req = https.request(options, function (res) {
                //console.log("++++++++++++++++++++++++", cont, "++++++++++++++++++++++++");
                //console.log("statusCode: ", res.statusCode);
                //console.log("headers: ", res.headers);
                if(res.statusCode != 200) {
                    console.log("statusCode != 200", res.statusCode);
                }
                res.read();
                res.on('data', function (d) {
                    console.log("##############data#################");
                    process.stdout.write(d);
                });
               // console.log("++++++++++++++++++++++++", cont++, "++++++++++++++++++++++++");
            });
            req.on('error', function (e) {
                console.error('REQ error', e);
                console.log(dataframe.b.y);
            });
            //console.log( dataframe)

            req.write(JSON.stringify(dataframe));
            req.end();
        board.samplesCount++;
         //console.log("#################", cont, "#################");
     });

    setTimeout(function(){
    board.pinMode(3, board.MODES.ANALOG);
    board.analogRead(3, function(data){
        console.log("Reading analog:   ", data);
    });
    }, 2000);
    }, 1500);
    board.on("errorTx", function(data){
        console.log("errorTx");
        console.log(data.errorCode);
        console.log(data.errorT);
    })

});