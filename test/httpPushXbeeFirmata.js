/**
 * Created by root on 29/01/15.
 */
var firmata=require("../node_modules/firmata");
var https = require('http');
var options = {
    hostname: 'encrypted.google.com',
    port: 2014,
    path: '/post/channels',
    method: 'POST'
};
//options.hostname='nidays.solvview.com';
options.hostname='pre.solvview.com';

var now = new Date();
var dataframe={
    b:{
        m: {
            id: "2_1_1", sP: 1, sR: 1,sC:1, ts: now.getTime()
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
        console.log("analogRead:", data)
        dataframe.b.y=data;
        req.write(JSON.stringify(dataframe));
        req.end();
    });

});








//options.path='/beagleboard/am335x_pru_package/blob/master/README.txt'


