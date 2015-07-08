var https = require('http');


var url=require("url");
var options = {
    hostname: 'demo.solvview.com',
    //hostname: '54.246.122.160',
    // port: 443,
    // path: '/api/back/post/channels',
    port: 3000,
    path: '/api/back/post/syscom',
    method: 'POST',
    headers:{
        authentication:'{"uuid":"daq_ohlconcesiones_1","token":"RJ3FokddHWN7izYs"}'
    }
};
//options.hostname='nidays.solvview.com';
options.hostname='demo.solvview.com';

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
                id: "3_1_1", sP: 100, sC: 10, ts: now.getTime()
            }, y: []
        },
        t: now
    }
    return dataframe;
};

var dataframe = buildSolvviewDataFrame();
dataframe.b.m.ts = (now);
dataframe.t= new Date (now);
dataframe.y=[1,1,1,1,1,1,1,1,1,1];

sendCloud(dataframe);


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
    req.setTimeout(1000,function(){
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


}/**
 * Created by arturo on 9/07/15.
 */
