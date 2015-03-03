/**
 * Created by root on 3/03/15.
 */
var dns = require('dns');
var util = require('util');
var concurrent = 100000000;
var iter = 1e5;

function doLookup(err) {
    if (err) {
        console.error(util.inspect(err));
        throw err;
    }
    if (0 < --iter)
        dns.lookup('google.com', doLookup);
}

for (var i = 0; i < concurrent; i++){
    console.log("counter",i);
    doLookup();
}
