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

    board.setFirmataTime();

    board.setSamplingInterval(100);


    board.setDeliveryInterval(1000,  function(data){  //65535 reset to streaming mode
        //console.log("sample packet in front", data)

       dataframe = buildSolvviewDataFrame();
       dataframe.b.m.ts = data.TS;
       dataframe.b.y=data.samples;




        var req = https.request(options, function (res) {
            console.log("statusCode: ", res.statusCode);
            console.log("headers: ", res.headers);

            res.on('data', function (d) {
                console.log("##############data#################");
                process.stdout.write(d);
            });
        });
        req.on('error', function (e) {
            console.error('REQ error', e);
        });
        console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>", dataframe)
        console.log(">>>>>>>>>>>>>>>>>>>>>>>>>><<<<<<<<<<<<<<<<<<<<<<<<<<<<")
        req.write(JSON.stringify(dataframe));
        req.end();
    });

    board.pinMode(3, board.MODES.ANALOG);

    board.analogRead(3, function(data){
        console.log("Reading analog:   ", data);
    });

});