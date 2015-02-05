/**
 * Created by root on 29/01/15.
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

}

var now = new Date();
var dataframe={
    h:{mId:"arturete"},
    b:{
        m: {
            id: "2_3_1", sP: 100,sC:10,ts: now.getTime()
        }
        ,y:[1]
    },
    t:now
};

var board=new firmata.Board("/dev/ttyUSB0", function(err){
    if (err){
        console.log("Init error");
        return;
    }

    console.log("Firmware: " + board.firmware.name + "-" + board.firmware.version.major + "." + board.firmware.version.minor);

    board.setSamplingInterval(1000);

    board.pinMode(2, board.MODES.ANALOG);



var counter = 0;
    board.analogRead(2, function(data){

        var req = https.request(options, function(res) {
            console.log("statusCode: ", res.statusCode);
            console.log("headers: ", res.headers);

            res.on('data', function(d) {
                console.log("##############data#################");
                process.stdout.write(d);
            });
        });

        req.on('error', function(e) {
            console.error('REQ error' ,e);
        });
       // console.log("Reading Analog0:   ", data);
        data=((data/1023)*5);

        dataframe.b.y=[data,data,data,data,data,data,data,data,data,data];

        dataframe.b.m.ts=now.getTime() + counter*1000;
        dataframe.t = new Date(dataframe.b.m.ts);
        console.log("analogRead:", dataframe);
        counter++;
        req.write(JSON.stringify(dataframe));
        req.end();
    });

});








//options.path='/beagleboard/am335x_pru_package/blob/master/README.txt'


