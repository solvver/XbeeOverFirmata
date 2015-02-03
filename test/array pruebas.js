/**
 * Created by root on 28/01/15.
 */

var newFrame = {    //añadido por arturo 17-12-2014   16:54
    type: 0x00, // xbee_api.constants.FRAME_TYPE.TX_REQUEST_64
    id: 0x52, // optional, nextFrameId() is called per default
    destination64: "0013A200406FB3A1",
    options: 0x00, // optional, 0x00 is default
    data:  new Buffer(100, 'utf8')
    //data: {}
};


console.log(newFrame);
/*for(var i=0;i<16;i++){
    console.log(newFrame.data[i])
}*/

newFrame.data.writeUInt8([0x11 | 0x25>>8], 0)
//writeAny(newFrame.data, 0, [0x11<<8 | 0x69], 'hex');

//newFrame.data.push([0x66, 0x67]);
console.log("**", newFrame.data);
console.log("___",newFrame.data[1])
for(var i=0;i<10;i++){
    console.log("->", newFrame.data[i])
}