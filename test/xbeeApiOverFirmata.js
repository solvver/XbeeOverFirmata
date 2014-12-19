/**
 * Created by root on 17/12/14.
 */

var construyendoFrames=function(datos) {

    this.newFrame = {
        type: 0x00, // xbee_api.constants.FRAME_TYPE.TX_REQUEST_64
        id: 0x52, // optional, nextFrameId() is called per default
        destination64: "0013A200406FB3AE",
        options: 0x00, // optional, 0x00 is default
        data: 0x00
    };
    this.newFrame.data=datos;

};

/*construyendoFrames.prototype.makeNewFrame= function (esto) {
    this.newFrame.data = esto;
}*/




   // buff=construyendoFrames(17);

    console.log(construyendoFrames(23));























