var https = require('http');

var options = {
    hostname: 'encrypted.google.com',
    port: 2014,
    path: '/post/channels',
    method: 'POST'
};
options.hostname='nidays.solvview.com';
//options.path='/beagleboard/am335x_pru_package/blob/master/README.txt'
var now = new Date();
var dataframe={
    h:{mId:"1_3_1_123123"}
    ,b:{
        m: {
            id: "1_3_1", sP: 1, sR: 1,sC:1, ts: now.getTime()
        }
        ,y:[1]
    },
    t:now
}
var req = https.request(options, function(res) {
    console.log("statusCode: ", res.statusCode);
    console.log("headers: ", res.headers);

    res.on('data', function(d) {
        process.stdout.write(d);
    });
});

req.write(JSON.stringify(dataframe));
req.end();

req.on('error', function(e) {
    console.error('errror' ,e);
});