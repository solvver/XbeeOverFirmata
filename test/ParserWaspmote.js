/**
 * Created by root on 17/07/14.
 */
/*var xbee_api = require('xbee-api');

var Xbee = new xbee_api.XBeeAPI();



exports = module.exports;
//exports.Xbee = Xbee;

//module.exports= addPaser;
exports.addParser = function (Xbee){
   console.log(Xbee._frame_parser)
      Xbee._frame_parser["ARTURO"] = function (frame, buffer) {
        console.log("Using our parser")
        frame.id = buffer.readUInt8(4); //packet.id
        frame.remote64H = buffer.parseAddress(buffer, 5, 4);
        frame.remote64L = buffer.parseAddress(buffer, 8, 4);
        frame.numFragment = buffer.readUint8(15);
        frame.packetLenght = (buffer.readUint8(2) - 11);
    };
    console.log( Xbee._frame_parser["ARTURO"])
    return Xbee;
}

//module.exports=Xbee;
//function addParser(Xbee) ;



