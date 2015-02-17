var assign = require("object-assign");

/**
 * @author Julian Gautier
 */
/**
 * Module Dependencies
 */
var util = require("util"),
  Emitter = require("events").EventEmitter,
  chrome = chrome || undefined,
  Encoder7Bit = require("./encoder7bit"),
  OneWireUtils = require("./onewireutils"),
  xbee = require("../../node_modules/xbee-api/lib/xbee-api.js")    //añadido por arturo 17-12-2014 16:54
  SerialPort = null;

var xbeeAPI = new xbee.XBeeAPI({             //añadido por arturo 17-12-2014   16:54
    api_mode: 1
});



var newFrame = {    //añadido por arturo 17-12-2014   16:54
        type: 0x00, // xbee_api.constants.FRAME_TYPE.TX_REQUEST_64
        id: 0, // optional, nextFrameId() is called per default
        destination64: "0013A200406FB3A1",
        options: 0x00, // optional, 0x00 is default
        data: {},
        data1: {},
        data2:{}
    };



try {
  if (process.browser) {
    SerialPort = require("browser-serialport").SerialPort;
  } else {
    SerialPort = require("serialport").SerialPort;
  }
} catch (err) {
  SerialPort = null;
}

if (SerialPort == null) {
  console.log("It looks like serialport didn't compile properly. This is a common problem and its fix is well documented here https://github.com/voodootikigod/node-serialport#to-install");
  throw "Missing serialport dependency";
}

/**
 * constants
 */

var ANALOG_MAPPING_QUERY = 0x69,
ANALOG_MAPPING_RESPONSE = 0x6A,
ANALOG_MESSAGE = 0xE0,
CAPABILITY_QUERY = 0x6B,
CAPABILITY_RESPONSE = 0x6C,
DIGITAL_MESSAGE = 0x90,
END_SYSEX = 0xF7,
EXTENDED_ANALOG = 0x6F,
I2C_CONFIG = 0x78,
I2C_REPLY = 0x77,
I2C_REQUEST = 0x76,
ONEWIRE_CONFIG_REQUEST = 0x41,
ONEWIRE_DATA = 0x73,
ONEWIRE_DELAY_REQUEST_BIT = 0x10,
ONEWIRE_READ_REPLY = 0x43,
ONEWIRE_READ_REQUEST_BIT = 0x08,
ONEWIRE_RESET_REQUEST_BIT = 0x01,
ONEWIRE_SEARCH_ALARMS_REPLY = 0x45,
ONEWIRE_SEARCH_ALARMS_REQUEST = 0x44,
ONEWIRE_SEARCH_REPLY = 0x42,
ONEWIRE_SEARCH_REQUEST = 0x40,
ONEWIRE_WITHDATA_REQUEST_BITS = 0x3C,
ONEWIRE_WRITE_REQUEST_BIT = 0x20,
PIN_MODE = 0xF4,
PIN_STATE_QUERY = 0x6D,
PIN_STATE_RESPONSE = 0x6E,
PULSE_IN = 0x74,
QUERY_FIRMWARE = 0x79,
REPORT_ANALOG = 0xC0,
REPORT_DIGITAL = 0xD0,
REPORT_VERSION = 0xF9,
SAMPLING_INTERVAL = 0x7A,
DELIVERY_INTERVAL = 0x75,
SET_TIME = 0x80,
SAMPLES_PACKET = 0x7D,
SERVO_CONFIG = 0x70,
START_SYSEX = 0xF0,
STEPPER = 0x72,
STRING_DATA = 0x71,
INT_DATA = 0x74,
SYSTEM_RESET = 0xFF;

/**
 * MIDI_RESPONSE contains functions to be called when we receive a MIDI message from the arduino.
 * used as a switch object as seen here http://james.padolsey.com/javascript/how-to-avoid-switch-case-syndrome/
 * @private
 */

var MIDI_RESPONSE = {};

/**
 * Handles a REPORT_VERSION response and emits the reportversion event.  Also turns on all pins to start reporting
 * @private
 * @param {Board} board the current arduino board we are working with.
 */

MIDI_RESPONSE[REPORT_VERSION] = function(board) {
    //console.log("==>PARSE report version");
  console.log("1.-Response==>report version");
  board.version.major = board.currentBuffer[1];
  board.version.minor = board.currentBuffer[2];
  board.emit("reportversion");
};

/**
 * Handles a ANALOG_MESSAGE response and emits "analog-read" and "analog-read-"+n events where n is the pin number.
 * @private
 * @param {Board} board the current arduino board we are working with.
 */

MIDI_RESPONSE[ANALOG_MESSAGE] = function(board) {
  var value = board.currentBuffer[1] | (board.currentBuffer[2] << 7);
  var pin = board.currentBuffer[0] & 0x0F;


  if (board.pins[board.analogPins[pin]]) {
    board.pins[board.analogPins[pin]].value = value;
  }

  board.emit("analog-read-" + pin, value);
  board.emit("analog-read", {
    pin: pin,
    value: value
  });
};



/**
 * Handles a DIGITAL_MESSAGE response and emits:
 * "digital-read"
 * "digital-read-"+n
 *
 * Where n is the pin number.
 *
 * @private
 * @param {Board} board the current arduino board we are working with.
 */

MIDI_RESPONSE[DIGITAL_MESSAGE] = function(board) {
    console.log("01010101DigitalMsg");
  var port = (board.currentBuffer[0] & 0x0F);
  var portValue = board.currentBuffer[1] | (board.currentBuffer[2] << 7);

  for (var i = 0; i < 8; i++) {
    var pinNumber = 8 * port + i;
    var pin = board.pins[pinNumber];
    if (pin && (pin.mode === board.MODES.INPUT)) {
      pin.value = (portValue >> (i & 0x07)) & 0x01;
      board.emit("digital-read-" + pinNumber, pin.value);
      board.emit("digital-read", {
        pin: pinNumber,
        value: pin.value
      });
    }
  }
};

/**
 * SYSEX_RESPONSE contains functions to be called when we receive a SYSEX message from the arduino.
 * used as a switch object as seen here http://james.padolsey.com/javascript/how-to-avoid-switch-case-syndrome/
 * @private
 */

var SYSEX_RESPONSE = {};


SYSEX_RESPONSE[SAMPLES_PACKET] = function(board) {
    console.log("")
    console.log("")
    console.log("")
    console.log("SAMPLESPACKETSAMPLESPACKETSAMPLESPACKETSAMPLESPACKETSAMPLESPACKET")
    board.samplesCount = 0;
    var pinesArray=[];
    var valueArray=[];
    var valueArrayIterator=0;
    var timeSP = new Date((0x7d0 | board.currentBuffer[2]), board.currentBuffer[3], board.currentBuffer[4], board.currentBuffer[5], board.currentBuffer[6], board.currentBuffer[7], 0);
    for (var i = 0; i < board.currentBuffer.length - 1;i++){
        if((board.currentBuffer[i]& 0xF0)==0xE0){
            //console.log("Una medida nalgalógica")
            var value = board.currentBuffer[i+1] | (board.currentBuffer[i+2] << 7);
            valueArray[valueArrayIterator]=value;
            var pin = board.currentBuffer[i] & 0x0F;
            if (board.pins[board.analogPins[pin]]) {
                board.pins[board.analogPins[pin]].value = value;
            }
            board.emit("samples-packet-" + pin, value, timeSP);
            board.emit("samples-packet", {
                pin: pin,
                value: value,
                time: timeSP
            });
        }
        if((board.currentBuffer[i]&0xF0)==0x90){
            console.log("Una medida digital");
            var port = Math.floor((board.currentBuffer[i] & 0x0F)/8);
            //console.log("port", port);
            //console.log("board.currentBuffer[i] & 0x0F", (board.currentBuffer[i] & 0x0F));
            var portValue = board.currentBuffer[i+1] | (board.currentBuffer[i+2] << 7);
            var pinNumber = 8 * port + (board.currentBuffer[i] & 0x0F);
            //console.log("pinNumber", pinNumber)
            var pin1 = board.pins[pinNumber];
            //console.log("pin1.value", pin1.value)
            if (pin1 && (pin1.mode === board.MODES.INPUT)) {
                pin1.value = (portValue >> (i & 0x07)) & 0x01;
                board.emit("samples-packet-" + pinNumber, pin1.value, timeSP);
                board.emit("samples-packet", {
                    pin: pinNumber,
                    value: pin1.value,
                    time: timeSP
                });
            }
        }
    }
};

/**
 * Handles a QUERY_FIRMWARE response and emits the "queryfirmware" event
 * @private
 * @param {Board} board the current arduino board we are working with.
 */

SYSEX_RESPONSE[QUERY_FIRMWARE] = function(board) {
  //console.log("3.-Response==>query firmware")
  var firmwareBuf = [];
  board.firmware.version = {};
  board.firmware.version.major = board.currentBuffer[2];
  board.firmware.version.minor = board.currentBuffer[3];
  for (var i = 4, length = board.currentBuffer.length - 2; i < length; i += 2) {
    firmwareBuf.push((board.currentBuffer[i] & 0x7F) | ((board.currentBuffer[i + 1] & 0x7F) << 7));
  }
  board.firmware.name = new Buffer(firmwareBuf).toString("utf8", 0, firmwareBuf.length);
  board.emit("queryfirmware");
};

/**
 * Handles a CAPABILITY_RESPONSE response and emits the "capability-query" event
 * @private
 * @param {Board} board the current arduino board we are working with.
 */

SYSEX_RESPONSE[CAPABILITY_RESPONSE] = function(board) {
  var supportedModes = 0;
    //console.log("6.-Response==>Capability response")
    function pushModes(modesArray, mode) {
    if (supportedModes & (1 << board.MODES[mode])) {
      modesArray.push(board.MODES[mode]);
    }
  }

  // Only create pins if none have been previously created on the instance.
  if (!board.pins.length) {
    for (var i = 2, n = 0; i < board.currentBuffer.length - 1; i++) {
      //console.log("Bytes CapabilityResponse" ,board.currentBuffer[i])
      if (board.currentBuffer[i] === 127) {
        var modesArray = [];
        Object.keys(board.MODES).forEach(pushModes.bind(null, modesArray));
        board.pins.push({
          supportedModes: modesArray,
          mode: board.MODES.UNKNOWN,
          value: 0,
          report: 1
        });
        supportedModes = 0;
        n = 0;
        continue;
      }
      if (n === 0) {
        supportedModes |= (1 << board.currentBuffer[i]);
      }
      n ^= 1;
    }
  } else {
      for (var i = 2, n = 0; i < board.currentBuffer.length - 1; i++) {
          //console.log("Bytes CapabilityResponse" ,board.currentBuffer[i])
          if (board.currentBuffer[i] === 127) {
              var modesArray = [];
              Object.keys(board.MODES).forEach(pushModes.bind(null, modesArray));
              board.pins.push({
                  supportedModes: modesArray,
                  mode: board.MODES.UNKNOWN,
                  value: 0,
                  report: 1
              });
              supportedModes = 0;
              n = 0;
              continue;
          }
          if (n === 0) {
              supportedModes |= (1 << board.currentBuffer[i]);
          }
          n ^= 1;
          if(board.currentBuffer[i]==0x99){
              //console.log("capabylity response PARSED")
              board.emit("capability-query");
          }
      }
  }

  //board.emit("capability-query");
};

/**
 * Handles a PIN_STATE response and emits the 'pin-state-'+n event where n is the pin number.
 *
 * Note about pin state: For output modes, the state is any value that has been
 * previously written to the pin. For input modes, the state is the status of
 * the pullup resistor.
 * @private
 * @param {Board} board the current arduino board we are working with.
 */

SYSEX_RESPONSE[PIN_STATE_RESPONSE] = function (board) {
  var pin = board.currentBuffer[2];
  board.pins[pin].mode = board.currentBuffer[3];
  board.pins[pin].state = board.currentBuffer[4];
  if (board.currentBuffer.length > 6) {
    board.pins[pin].state |= (board.currentBuffer[5] << 7);
  }
  if (board.currentBuffer.length > 7) {
    board.pins[pin].state |= (board.currentBuffer[6] << 14);
  }
  board.emit("pin-state-" + pin);
};

/**
 * Handles a ANALOG_MAPPING_RESPONSE response and emits the "analog-mapping-query" event.
 * @private
 * @param {Board} board the current arduino board we are working with.
 */

SYSEX_RESPONSE[ANALOG_MAPPING_RESPONSE] = function(board) {
 // console.log("9.-Response==>AnalogMappingResponse")
  var pin = 0;
  var currentValue;
  for (var i = 2; i < board.currentBuffer.length - 1; i++) {               //board.currentBuffer.length - 1   ***
    currentValue = board.currentBuffer[i];
    board.pins[pin].analogChannel = currentValue;
    if (currentValue !== 127) {
      board.analogPins.push(pin);
    }
   pin++;
  }
  board.emit("analog-mapping-query");
};

/**
 * Handles a I2C_REPLY response and emits the "I2C-reply-"+n event where n is the slave address of the I2C device.
 * The event is passed the buffer of data sent from the I2C Device
 * @private
 * @param {Board} board the current arduino board we are working with.
 */

SYSEX_RESPONSE[I2C_REPLY] = function(board) {
  var replyBuffer = [];
  var slaveAddress = (board.currentBuffer[2] & 0x7F) | ((board.currentBuffer[3] & 0x7F) << 7);
  var register = (board.currentBuffer[4] & 0x7F) | ((board.currentBuffer[5] & 0x7F) << 7);
  for (var i = 6, length = board.currentBuffer.length - 1; i < length; i += 2) {
    replyBuffer.push(board.currentBuffer[i] | (board.currentBuffer[i + 1] << 7));
  }
  board.emit("I2C-reply-" + slaveAddress, replyBuffer);
};

SYSEX_RESPONSE[ONEWIRE_DATA] = function(board) {
  var subCommand = board.currentBuffer[2];

  if (!SYSEX_RESPONSE[subCommand]) {
    return;
  }

  SYSEX_RESPONSE[subCommand](board);
};

SYSEX_RESPONSE[ONEWIRE_SEARCH_REPLY] = function(board) {
  var pin = board.currentBuffer[3];
  var replyBuffer = board.currentBuffer.slice(4, board.currentBuffer.length - 1);

  board.emit("1-wire-search-reply-" + pin, OneWireUtils.readDevices(replyBuffer));
};

SYSEX_RESPONSE[ONEWIRE_SEARCH_ALARMS_REPLY] = function(board) {
  var pin = board.currentBuffer[3];
  var replyBuffer = board.currentBuffer.slice(4, board.currentBuffer.length - 1);

  board.emit("1-wire-search-alarms-reply-" + pin, OneWireUtils.readDevices(replyBuffer));
};

SYSEX_RESPONSE[ONEWIRE_READ_REPLY] = function(board) {
  var encoded = board.currentBuffer.slice(4, board.currentBuffer.length - 1);
  var decoded = Encoder7Bit.from7BitArray(encoded);
  var correlationId = (decoded[1] << 8) | decoded[0];

  board.emit("1-wire-read-reply-" + correlationId, decoded.slice(2));
};

/**
 * Handles a STRING_DATA response and logs the string to the console.
 * @private
 * @param {Board} board the current arduino board we are working with.
 */

SYSEX_RESPONSE[STRING_DATA] = function(board) {
  var string = new Buffer(board.currentBuffer.slice(2, -1)).toString("utf8").replace(/\0/g, "");
  board.emit("string", string);
};

SYSEX_RESPONSE[INT_DATA] = function(board) {
    var number = new Buffer(board.currentBuffer.slice(2, -1)).toString("HEX").replace(/\0/g, "");
    board.emit("int-data", number);
};

/**
 * Response from pulseIn
 */

SYSEX_RESPONSE[PULSE_IN] = function(board) {
  var pin = (board.currentBuffer[2] & 0x7F) | ((board.currentBuffer[3] & 0x7F) << 7);
  var durationBuffer = [
    (board.currentBuffer[4] & 0x7F) | ((board.currentBuffer[5] & 0x7F) << 7), (board.currentBuffer[6] & 0x7F) | ((board.currentBuffer[7] & 0x7F) << 7), (board.currentBuffer[8] & 0x7F) | ((board.currentBuffer[9] & 0x7F) << 7), (board.currentBuffer[10] & 0x7F) | ((board.currentBuffer[11] & 0x7F) << 7)
  ];
  var duration = ((durationBuffer[0] << 24) +
    (durationBuffer[1] << 16) +
    (durationBuffer[2] << 8) +
    (durationBuffer[3]));
  board.emit("pulse-in-" + pin, duration);
};

/**
 * Handles the message from a stepper completing move
 * @param {Board} board
 */

SYSEX_RESPONSE[STEPPER] = function(board) {
  var deviceNum = board.currentBuffer[2];
  board.emit("stepper-done-" + deviceNum, true);
};


/**
 * @class The Board object represents an arduino board.
 * @augments EventEmitter
 * @param {String} port This is the serial port the arduino is connected to.
 * @param {function} function A function to be called when the arduino is ready to communicate.
 * @property MODES All the modes available for pins on this arduino board.
 * @property I2C_MODES All the I2C modes available.
 * @property HIGH A constant to set a pins value to HIGH when the pin is set to an output.
 * @property LOW A constant to set a pins value to LOW when the pin is set to an output.
 * @property pins An array of pin object literals.
 * @property analogPins An array of analog pins and their corresponding indexes in the pins array.
 * @property version An object indicating the major and minor version of the firmware currently running.
 * @property firmware An object indicateon the name, major and minor version of the firmware currently running.
 * @property currentBuffer An array holding the current bytes received from the arduino.
 * @property {SerialPort} sp The serial port object used to communicate with the arduino.
 */
var Board = function(port, options, callback) {
  Emitter.call(this);
  var self=this;
  if (typeof options === "function" || typeof options === "undefined") {
    callback = options;
    options = {};
  }

  var board = this;
  var defaults = {
    reportVersionTimeout: 5000,/*
    skipCapabilities: 1,*/
    serialport: {
      baudRate: 57600,
      bufferSize: 1
    }
  };

  var settings = assign({}, defaults, options);

  var ready = function() {
      console.log("99.-Ready state, let's go to do something interesting")
    this.emit("ready");
    if (typeof callback === "function") {
      callback();
    }
  }.bind(this);

  this.MODES = {
    INPUT: 0x00,
    OUTPUT: 0x01,
    ANALOG: 0x02,
    PWM: 0x03,
    SERVO: 0x04,
    SHIFT: 0x05,
    I2C: 0x06,
    ONEWIRE: 0x07,
    STEPPER: 0x08,
    IGNORE: 0x7F,
    UNKOWN: 0x10
  };

  this.I2C_MODES = {
    WRITE: 0x00,
    READ: 1,
    CONTINUOUS_READ: 2,
    STOP_READING: 3
  };

  this.STEPPER = {
    TYPE: {
      DRIVER: 1,
      TWO_WIRE: 2,
      FOUR_WIRE: 4
    },
    RUNSTATE: {
      STOP: 0,
      ACCEL: 1,
      DECEL: 2,
      RUN: 3
    },
    DIRECTION: {
      CCW: 0,
      CW: 1
    }
  };

  this.HIGH = 1;
  this.LOW = 0;
  this.pins = [];
  this.analogPins = [];
  this.version = {};
  this.firmware = {};
  this.currentBuffer = [];
  this.versionReceived = false;
  this.name = "Firmata";
  this.samplesCount = 0;

  var cb=function(){
      cb.counter--;
      if(cb.counter ==0){
          console.log("Executing report version")
          board.reportVersion(function () {
              board.queryFirmware(function () {
              });
          });
      }
  }
    cb.counter=1;


  if (typeof port === "object") {
    this.sp = port;
  } else {
      settings.serialport.dataCallback = xbeeAPI.parseRaw.bind(xbeeAPI);

      this.sp = new SerialPort(port, settings.serialport, undefined, function (err) {
          if (err) console.log("error open serialPort");
         /* board.reportVersion(function () {
              board.queryFirmware(function () {*/
                  cb();
                  //}
            //  });
          })
      }
      this.sp.on("error", function (string) {
          console.log("###%!!!error serial port")
          if (typeof callback === "function") {
              callback(string);
          }
      });
      xbeeAPI.on("frame_object", function (frame) {  //emmited when msg is available
          //console.log("OBJ> "+util.inspect(frame));
          //console.log("frame_object EVENT:")
          if (frame.type == 0x89) {
              if(frame.deliveryStatus) {
                  console.log("Tx error");
                  switch (frame.deliveryStatus) {
                      case 1:
                          console.log("No ACK received");
                          break;
                      case 2:
                          console.log("CCA failure");
                          break;
                      case 3:
                          console.log("Purged")
                          break;
                  }
                  self.emit("repeatTx"+frame.buildState.frameId);
              }
              else console.log("Tx OK")
          }
          if (frame.type == 0x80) {
              //console.log("Rx 64bit addrs packet");
              //console.log(frame.data.toString(16));
              if (!this.versionReceived && frame.data[0] !== REPORT_VERSION) {
                  return;
              } else {
                  this.versionReceived = true;
              }

              for (var i = 0; i < frame.data.length; i++) {
                  //console.log("Data>>", frame.data[i].toString(16));
                  //console.log("last byte", self.currentBuffer[self.currentBuffer.length - 1]);
                  byt = frame.data[i];
                  // we dont want to push 0 as the first byte on our buffer
                  if (self.currentBuffer.length === 0 && byt === 0) {
                      continue;
                  } else {
                      self.currentBuffer.push(byt);

                      // [START_SYSEX, ... END_SYSEX]
                      if (self.currentBuffer[0] === START_SYSEX && SYSEX_RESPONSE[self.currentBuffer[1]] && self.currentBuffer[self.currentBuffer.length - 1] === END_SYSEX) {
                          //console.log("==>Sysex message<==")
                          SYSEX_RESPONSE[self.currentBuffer[1]](self);
                          self.currentBuffer.length = 0;
                      } else if (self.currentBuffer[0] !== START_SYSEX) {
                          // Check if data gets out of sync: first byte in buffer
                          // must be a valid command if not START_SYSEX
                          // Identify command on first byte
                          cmd = self.currentBuffer[0] < 240 ? self.currentBuffer[0] & 0xF0 : self.currentBuffer[0];

                          // Check if it is not a valid command
                          if (cmd !== REPORT_VERSION && cmd !== ANALOG_MESSAGE && cmd !== DIGITAL_MESSAGE) {
                              // console.log("OUT OF SYNC - CMD: "+cmd);
                              // Clean buffer
                              self.currentBuffer.length = 0;
                          }
                      }

                      // There are 3 bytes in the buffer and the first is not START_SYSEX:
                      // Might have a MIDI Command
                      if (self.currentBuffer.length === 3 && self.currentBuffer[0] !== START_SYSEX) {
                          //commands under 0xF0 we have a multi byte command
                          if (self.currentBuffer[0] < 240) {
                              cmd = self.currentBuffer[0] & 0xF0;
                          } else {
                              cmd = self.currentBuffer[0];
                          }

                          if (MIDI_RESPONSE[cmd]) {
                              MIDI_RESPONSE[cmd](self);
                              self.currentBuffer.length = 0;
                          } else {
                              // A bad serial read must have happened.
                              // Reseting the buffer will allow recovery.
                              self.currentBuffer.length = 0;
                          }
                      }
                  }
              }
          }
      })
      //}.bind(this));
  //}

  // if we have not received the version within the alotted
  // time specified by the reportVersionTimeout (user or default),
  // then send an explicit request for it.
  this.reportVersionTimeoutId = setTimeout(function() {
    if (this.versionReceived === false) {
      this.reportVersion(function() {});
      this.queryFirmware(function() {});
    }
  }.bind(this), settings.reportVersionTimeout);

  // Await the reported version.
  this.once("reportversion", function() {
    // console.log("2.-report version event Board ")
    clearTimeout(this.reportVersionTimeoutId);
    this.versionReceived = true;
    this.once("queryfirmware", function() {
        //console.log("3.1.-evento query firmware board")
        if (settings.samplingInterval) {
        this.setSamplingInterval(settings.samplingInterval);
      }
      if (settings.skipCapabilities) {
        ready();
      } else {
        //  console.log("4.-queryCapabilities & queryAnalog Mapping")
          this.queryCapabilities(function() {
          //console.log("queryAnalogMapping")
          this.queryAnalogMapping(ready);
        });
      }
    });
  });

    /*this.on("waitingTxStatus", function(){

    })*/
};

util.inherits(Board, Emitter);

/**
 * Asks the arduino to tell us its version.
 * @param {function} callback A function to be called when the arduino has reported its version.
 */

Board.prototype.reportVersion = function(callback) {
  this.once("reportversion", callback);
    //console.log("2.-Emmit==>reportVersion prototype event")
    newFrame.data = REPORT_VERSION;
    newFrame.data1 = 0;
    newFrame.data2 = 0;
    //newFrame.data.push(REPORT_VERSION);
      this.sp.write(new Buffer(xbeeAPI.buildFrame(newFrame)), function (err, results) {
          if (err) console.log("writing S.P. ERROR", err, results);
      });
};

/**
 * Asks the arduino to tell us its firmware version.
 * @param {function} callback A function to be called when the arduino has reported its firmware version.
 */

Board.prototype.queryFirmware = function(callback) {
    //console.log("3.-Emmit==>Query firmware event")
  this.once("queryfirmware", callback);
  newFrame.data=START_SYSEX<<16 | QUERY_FIRMWARE<<8 | END_SYSEX;
  this.sp.write(new Buffer(xbeeAPI.buildFrame(newFrame)), function(err, results){
     if (err) console.log("writing S.P. ERROR", err, results);
  });
};

/**
 * Asks the arduino to read analog data. Turn on reporting for this pin.
 * @param {number} pin The pin to read analog data
 * @param {function} callback A function to call when we have the analag data.
 */

Board.prototype.analogRead = function(pin, callback) {
  this.reportAnalogPin(pin, 1);
  this.addListener("analog-read-" + pin, callback);
};

/**
 * Asks the arduino to write an analog message.
 * @param {number} pin The pin to write analog data to.
 * @param {nubmer} value The data to write to the pin between 0 and 255.
 */

Board.prototype.analogWrite = function(pin, value) {
  var data = [];

  this.pins[pin].value = value;

  if (pin > 15) {
    data[0] = START_SYSEX;
    data[1] = EXTENDED_ANALOG;
    data[2] = pin;
    data[3] = value & 0x7F;
    data[4] = (value >> 7) & 0x7F;

    if (value > 0x00004000) {
      data[data.length] = (value >> 14) & 0x7F;
    }

    if (value > 0x00200000) {
      data[data.length] = (value >> 21) & 0x7F;
    }

    if (value > 0x10000000) {
      data[data.length] = (value >> 28) & 0x7F;
    }

    data[data.length] = END_SYSEX;
  } else {
    data.push(ANALOG_MESSAGE | pin, value & 0x7F, (value >> 7) & 0x7F);
  }

  this.sp.write(new Buffer(data));
};

/**
 * Set a pin to SERVO mode with an explicit PWM range.
 *
 * @param {number} pin The pin the servo is connected to
 * @param {number} min A 14-bit signed int.
 * @param {number} max A 14-bit signed int.
 */

Board.prototype.servoConfig = function(pin, min, max) {
  // [0]  START_SYSEX  (0xF0)
  // [1]  SERVO_CONFIG (0x70)
  // [2]  pin number   (0-127)
  // [3]  minPulse LSB (0-6)
  // [4]  minPulse MSB (7-13)
  // [5]  maxPulse LSB (0-6)
  // [6]  maxPulse MSB (7-13)
  // [7]  END_SYSEX    (0xF7)

  var data = [
    START_SYSEX,
    SERVO_CONFIG,
    pin,
    min & 0x7F,
    (min >> 7) & 0x7F,
    max & 0x7F,
    (max >> 7) & 0x7F,
    END_SYSEX
  ];

  this.pins[pin].mode = this.MODES.SERVO;
  this.sp.write(new Buffer(data));
};

/**
 * Asks the arduino to move a servo
 * @param {number} pin The pin the servo is connected to
 * @param {number} value The degrees to move the servo to.
 */

Board.prototype.servoWrite = function(pin, value) {
  // Values less than 544 will be treated as angles in degrees
  // (valid values in microseconds are handled as microseconds)
  this.analogWrite.apply(this, arguments);
};

/**
 * Asks the arduino to set the pin to a certain mode.
 * @param {number} pin The pin you want to change the mode of.
 * @param {number} mode The mode you want to set. Must be one of board.MODES
 */

Board.prototype.pinMode = function(pin, mode) {
  this.pins[pin].mode = mode;
  newFrame.data=PIN_MODE<<16 | pin<<8 | mode;
  this.sp.write(new Buffer(xbeeAPI.buildFrame(newFrame)));
  //this.sp.write(new Buffer([PIN_MODE, pin, mode]));
};

Board.prototype.setFirmataTime = function() {
    var date = new Date();
    var day = (date.getDate()+16);        // yields day
    var month = (date.getMonth()+16);    // yields month
    var year = date.getFullYear();  // yields year
    var hour = date.getHours()+16;     // yields hours
    var minute = date.getMinutes()+16; // yields minutes
    var second = date.getSeconds()+16; // yields seconds
// After this construct a string with the above results as below
    newFrame.data=START_SYSEX<<16 | SET_TIME<<8 | (year.toString()&0x0F);  //chapuza con 0x0F
    newFrame.data1=   (month.toString()<<16) | (day.toString()<<8) | hour.toString();
    newFrame.data2=   (minute.toString()<<16) | (second.toString()<<8) | END_SYSEX;
    this.sp.write(new Buffer(xbeeAPI.buildFrame(newFrame)));
    newFrame.data1=0;
    newFrame.data2=0;
};

/**
 * Asks the arduino to write a value to a digital pin
 * @param {number} pin The pin you want to write a value to.
 * @param {value} value The value you want to write. Must be board.HIGH or board.LOW
 */

Board.prototype.digitalWrite = function(pin, value) {
  var port = Math.floor(pin / 8);
  var portValue = 0;
  this.pins[pin].value = value;
  for (var i = 0; i < 8; i++) {
    if (this.pins[8 * port + i].value) {
      portValue |= (1 << i);
    }
  }
  this.sp.write(new Buffer([DIGITAL_MESSAGE | port, portValue & 0x7F, (portValue >> 7) & 0x7F]));
};

/**
 * Asks the arduino to read digital data. Turn on reporting for this pin's port.
 *
 * @param {number} pin The pin to read data from
 * @param {function} callback The function to call when data has been received
 */

Board.prototype.digitalRead = function(pin, callback) {
  this.reportDigitalPin(pin, 1);
  this.addListener("digital-read-" + pin, callback);
};

/**
 * Asks the arduino to tell us its capabilities
 * @param {function} callback A function to call when we receive the capabilities
 */

Board.prototype.queryCapabilities = function(callback) {
  this.once("capability-query", callback);
 // console.log("5.-Emmit==>queryCapabilities")
  newFrame.data=START_SYSEX<<16 | CAPABILITY_QUERY<<8 | END_SYSEX;
  this.sp.write(new Buffer(xbeeAPI.buildFrame(newFrame)));
};

/**
 * Asks the arduino to tell us its analog pin mapping
 * @param {function} callback A function to call when we receive the pin mappings.
 */

Board.prototype.queryAnalogMapping = function(callback) {
    console.log("8.-Emmit==>query analog mapping")
  this.once("analog-mapping-query", callback);
  newFrame.data=START_SYSEX<<16 | ANALOG_MAPPING_QUERY<<8 | END_SYSEX;
  this.sp.write(new Buffer(xbeeAPI.buildFrame(newFrame)));
};

/**
 * Asks the arduino to tell us the current state of a pin
 * @param {number} pin The pin we want to the know the state of
 * @param {function} callback A function to call when we receive the pin state.
 */

Board.prototype.queryPinState = function(pin, callback) {
  this.once("pin-state-" + pin, callback);
  this.sp.write(new Buffer([START_SYSEX, PIN_STATE_QUERY, pin, END_SYSEX]));
};

/**
 * Sends a I2C config request to the arduino board with an optional
 * value in microseconds to delay an I2C Read.  Must be called before
 * an I2C Read or Write
 * @param {number} delay in microseconds to set for I2C Read
 */

Board.prototype.sendI2CConfig = function(delay) {
  delay = delay || 0;
  this.sp.write(new Buffer([START_SYSEX, I2C_CONFIG, (delay & 0xFF), ((delay >> 8) & 0xFF), END_SYSEX]));
};

/**
 * Sends a string to the arduino
 * @param {String} string to send to the device
 */

Board.prototype.sendString = function(string) {
  var bytes = new Buffer(string + "\0", "utf8");
  var data = [];
  data.push(START_SYSEX);
  data.push(STRING_DATA);
  for (var i = 0, length = bytes.length; i < length; i++) {
    data.push(bytes[i] & 0x7F);
    data.push((bytes[i] >> 7) & 0x7F);
  }
  data.push(END_SYSEX);
  this.sp.write(data);
};

/**
 * Asks the arduino to send an I2C request to a device
 * @param {number} slaveAddress The address of the I2C device
 * @param {Array} bytes The bytes to send to the device
 */

Board.prototype.sendI2CWriteRequest = function(slaveAddress, bytes) {
  var data = [];
  bytes = bytes || [];
  data.push(START_SYSEX);
  data.push(I2C_REQUEST);
  data.push(slaveAddress);
  data.push(this.I2C_MODES.WRITE << 3);
  for (var i = 0, length = bytes.length; i < length; i++) {
    data.push(bytes[i] & 0x7F);
    data.push((bytes[i] >> 7) & 0x7F);
  }
  data.push(END_SYSEX);
  this.sp.write(new Buffer(data));
};

/**
 * Asks the arduino to request bytes from an I2C device
 * @param {number} slaveAddress The address of the I2C device
 * @param {number} numBytes The number of bytes to receive.
 * @param {function} callback A function to call when we have received the bytes.
 */

Board.prototype.sendI2CReadRequest = function(slaveAddress, numBytes, callback) {
  this.sp.write(new Buffer([START_SYSEX, I2C_REQUEST, slaveAddress, this.I2C_MODES.READ << 3, numBytes & 0x7F, (numBytes >> 7) & 0x7F, END_SYSEX]));
  this.once("I2C-reply-" + slaveAddress, callback);
};

/**
 * Configure the passed pin as the controller in a 1-wire bus.
 * Pass as enableParasiticPower true if you want the data pin to power the bus.
 * @param pin
 * @param enableParasiticPower
 */
Board.prototype.sendOneWireConfig = function(pin, enableParasiticPower) {
  this.sp.write(new Buffer([START_SYSEX, ONEWIRE_DATA, ONEWIRE_CONFIG_REQUEST, pin, enableParasiticPower ? 0x01 : 0x00, END_SYSEX]));
};

/**
 * Searches for 1-wire devices on the bus.  The passed callback should accept
 * and error argument and an array of device identifiers.
 * @param pin
 * @param callback
 */
Board.prototype.sendOneWireSearch = function(pin, callback) {
  this._sendOneWireSearch(ONEWIRE_SEARCH_REQUEST, "1-wire-search-reply-" + pin, pin, callback);
};

/**
 * Searches for 1-wire devices on the bus in an alarmed state.  The passed callback
 * should accept and error argument and an array of device identifiers.
 * @param pin
 * @param callback
 */
Board.prototype.sendOneWireAlarmsSearch = function(pin, callback) {
  this._sendOneWireSearch(ONEWIRE_SEARCH_ALARMS_REQUEST, "1-wire-search-alarms-reply-" + pin, pin, callback);
};

Board.prototype._sendOneWireSearch = function(type, event, pin, callback) {
  this.sp.write(new Buffer([START_SYSEX, ONEWIRE_DATA, type, pin, END_SYSEX]));

  var searchTimeout = setTimeout(function() {
    callback(new Error("1-Wire device search timeout - are you running ConfigurableFirmata?"));
  }, 5000);
  this.once(event, function(devices) {
    clearTimeout(searchTimeout);

    callback(null, devices);
  });
};

/**
 * Reads data from a device on the bus and invokes the passed callback.
 *
 * N.b. ConfigurableFirmata will issue the 1-wire select command internally.
 * @param pin
 * @param device
 * @param numBytesToRead
 * @param callback
 */
Board.prototype.sendOneWireRead = function(pin, device, numBytesToRead, callback) {
  var correlationId = Math.floor(Math.random() * 255);
  var readTimeout = setTimeout(function() {
    callback(new Error("1-Wire device read timeout - are you running ConfigurableFirmata?"));
  }, 5000);
  this._sendOneWireRequest(pin, ONEWIRE_READ_REQUEST_BIT, device, numBytesToRead, correlationId, null, null, "1-wire-read-reply-" + correlationId, function(data) {
    clearTimeout(readTimeout);

    callback(null, data);
  });
};

/**
 * Resets all devices on the bus.
 * @param pin
 */
Board.prototype.sendOneWireReset = function(pin) {
  this._sendOneWireRequest(pin, ONEWIRE_RESET_REQUEST_BIT);
};

/**
 * Writes data to the bus to be received by the passed device.  The device
 * should be obtained from a previous call to sendOneWireSearch.
 *
 * N.b. ConfigurableFirmata will issue the 1-wire select command internally.
 * @param pin
 * @param device
 * @param data
 */
Board.prototype.sendOneWireWrite = function(pin, device, data) {
  this._sendOneWireRequest(pin, ONEWIRE_WRITE_REQUEST_BIT, device, null, null, null, Array.isArray(data) ? data : [data]);
};

/**
 * Tells firmata to not do anything for the passed amount of ms.  For when you
 * need to give a device attached to the bus time to do a calculation.
 * @param pin
 */
Board.prototype.sendOneWireDelay = function(pin, delay) {
  this._sendOneWireRequest(pin, ONEWIRE_DELAY_REQUEST_BIT, null, null, null, delay);
};

/**
 * Sends the passed data to the passed device on the bus, reads the specified
 * number of bytes and invokes the passed callback.
 *
 * N.b. ConfigurableFirmata will issue the 1-wire select command internally.
 * @param pin
 * @param device
 * @param data
 * @param numBytesToRead
 * @param callback
 */
Board.prototype.sendOneWireWriteAndRead = function(pin, device, data, numBytesToRead, callback) {
  var correlationId = Math.floor(Math.random() * 255);
  var readTimeout = setTimeout(function() {
    callback(new Error("1-Wire device read timeout - are you running ConfigurableFirmata?"));
  }, 5000);
  this._sendOneWireRequest(pin, ONEWIRE_WRITE_REQUEST_BIT | ONEWIRE_READ_REQUEST_BIT, device, numBytesToRead, correlationId, null, Array.isArray(data) ? data : [data], "1-wire-read-reply-" + correlationId, function(data) {
    clearTimeout(readTimeout);

    callback(null, data);
  });
};

// see http://firmata.org/wiki/Proposals#OneWire_Proposal
Board.prototype._sendOneWireRequest = function(pin, subcommand, device, numBytesToRead, correlationId, delay, dataToWrite, event, callback) {
  var bytes = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  if (device || numBytesToRead || correlationId || delay || dataToWrite) {
    subcommand = subcommand | ONEWIRE_WITHDATA_REQUEST_BITS;
  }

  if (device) {
    bytes.splice.apply(bytes, [0, 8].concat(device));
  }

  if (numBytesToRead) {
    bytes[8] = numBytesToRead & 0xFF;
    bytes[9] = (numBytesToRead >> 8) & 0xFF;
  }

  if (correlationId) {
    bytes[10] = correlationId & 0xFF;
    bytes[11] = (correlationId >> 8) & 0xFF;
  }

  if (delay) {
    bytes[12] = delay & 0xFF;
    bytes[13] = (delay >> 8) & 0xFF;
    bytes[14] = (delay >> 16) & 0xFF;
    bytes[15] = (delay >> 24) & 0xFF;
  }

  if (dataToWrite) {
    dataToWrite.forEach(function(byte) {
      bytes.push(byte);
    });
  }

  var output = [START_SYSEX, ONEWIRE_DATA, subcommand, pin];
  output = output.concat(Encoder7Bit.to7BitArray(bytes));
  output.push(END_SYSEX);

  this.sp.write(new Buffer(output));

  if (event && callback) {
    this.once(event, callback);
  }
};

/**
 * Set sampling interval in millis. Default is 19 ms
 * @param {number} interval The sampling interval in ms > 10
 */

Board.prototype.setSamplingInterval = function(interval) {   //Ok
  var safeint = interval < 10 ? 10 : (interval > 65535 ? 65535 : interval); // constrained 10-65535
    newFrame.data=(START_SYSEX<<8 | SAMPLING_INTERVAL)
    newFrame.data1= ( (safeint & 0xFF)<<16 | ((safeint >> 8) & 0xFF)<<8 | END_SYSEX);
    this.sp.write(new Buffer(xbeeAPI.buildFrame(newFrame)));
    newFrame.data1=0;
 // this.sp.write(new Buffer([START_SYSEX, SAMPLING_INTERVAL, (safeint & 0xFF), ((safeint >> 8) & 0xFF), END_SYSEX]));
};

Board.prototype.setDeliveryInterval = function(interval, callback) {   //OK if interval===0 cancel
    if (((interval & 0xFF000000)>>24)){
        newFrame.data=START_SYSEX<<16| DELIVERY_INTERVAL<<8 | ((interval & 0xFF000000)>>24);
        newFrame.data1=((((interval & 0x00FF0000)>>16)<<16) | (((interval & 0x0000FF00)>>8)<<8) | (interval & 0x000000FF));
        newFrame.data2=END_SYSEX;
    } else if (((interval & 0x00FF0000)>>16)) {
        newFrame.data=START_SYSEX<<16| DELIVERY_INTERVAL<<8 | (((interval & 0x00FF0000)>>16));
        newFrame.data1=((((interval & 0x0000FF00)>>8)<<16) | (interval & 0x000000FF)<<8 | END_SYSEX);
    } else {
        newFrame.data=START_SYSEX<<16| DELIVERY_INTERVAL<<8 | (((interval & 0x0000FF00)>>8));
        newFrame.data1=((interval & 0x000000FF)<<8  |  END_SYSEX);
    }
    this.sp.write(new Buffer(xbeeAPI.buildFrame(newFrame)));
    newFrame.data1=0;
    newFrame.data2=0;
    //this.sp.write(new Buffer([START_SYSEX, SAMPLING_INTERVAL, (safeint & 0xFF), ((safeint >> 8) & 0xFF), END_SYSEX]));
    this.addListener("samples-packet", callback);
    //this.addListener("samples-packet-" + pin, callback);
};

/**
 * Set reporting on pin
 * @param {number} pin The pin to turn on/off reporting
 * @param {number} value Binary value to turn reporting on/off
 */

Board.prototype.reportAnalogPin = function(pin, value) {
  if (value === 0 || value === 1) {
    this.pins[this.analogPins[pin]].report = value;
    newFrame.data=REPORT_ANALOG<<16 | pin<<8 | value;
    this.sp.write(new Buffer(xbeeAPI.buildFrame(newFrame)));
   // this.sp.write(new Buffer([REPORT_ANALOG | pin, value]));
  }
};

/**
 * Set reporting on pin
 * @param {number} pin The pin to turn on/off reporting
 * @param {number} value Binary value to turn reporting on/off
 */

Board.prototype.reportDigitalPin = function(pin, value) {
  var port = Math.floor(pin / 8);
  console.log("reportDigitalPin  port:");
  console.log(port);
  if (value === 0 || value === 1) {
    this.pins[pin].report = value;
    newFrame.data=(REPORT_DIGITAL | port)<<8 | value;
    this.sp.write(new Buffer(xbeeAPI.buildFrame(newFrame)));
  }
};

/**
 *
 *
 */

Board.prototype.pulseIn = function(opts, callback) {
  var pin = opts.pin;
  var value = opts.value;
  var pulseOut = opts.pulseOut || 0;
  var timeout = opts.timeout || 1000000;
  var pulseOutArray = [
    ((pulseOut >> 24) & 0xFF), ((pulseOut >> 16) & 0xFF), ((pulseOut >> 8) & 0XFF), ((pulseOut & 0xFF))
  ];
  var timeoutArray = [
    ((timeout >> 24) & 0xFF), ((timeout >> 16) & 0xFF), ((timeout >> 8) & 0XFF), ((timeout & 0xFF))
  ];
  var data = [
    START_SYSEX,
    PULSE_IN,
    pin,
    value,
    pulseOutArray[0] & 0x7F, (pulseOutArray[0] >> 7) & 0x7F,
    pulseOutArray[1] & 0x7F, (pulseOutArray[1] >> 7) & 0x7F,
    pulseOutArray[2] & 0x7F, (pulseOutArray[2] >> 7) & 0x7F,
    pulseOutArray[3] & 0x7F, (pulseOutArray[3] >> 7) & 0x7F,
    timeoutArray[0] & 0x7F, (timeoutArray[0] >> 7) & 0x7F,
    timeoutArray[1] & 0x7F, (timeoutArray[1] >> 7) & 0x7F,
    timeoutArray[2] & 0x7F, (timeoutArray[2] >> 7) & 0x7F,
    timeoutArray[3] & 0x7F, (timeoutArray[3] >> 7) & 0x7F,
    END_SYSEX
  ];
  this.sp.write(new Buffer(data));
  this.once("pulse-in-" + pin, callback);
};

/**
 * Stepper functions to support AdvancedFirmata"s asynchronous control of stepper motors
 * https://github.com/soundanalogous/AdvancedFirmata
 */

/**
 * Asks the arduino to configure a stepper motor with the given config to allow asynchronous control of the stepper
 * @param {number} deviceNum Device number for the stepper (range 0-5, expects steppers to be setup in order from 0 to 5)
 * @param {number} type One of this.STEPPER.TYPE.*
 * @param {number} stepsPerRev Number of steps motor takes to make one revolution
 * @param {number} dirOrMotor1Pin If using EasyDriver type stepper driver, this is direction pin, otherwise it is motor 1 pin
 * @param {number} stepOrMotor2Pin If using EasyDriver type stepper driver, this is step pin, otherwise it is motor 2 pin
 * @param {number} [motor3Pin] Only required if type == this.STEPPER.TYPE.FOUR_WIRE
 * @param {number} [motor4Pin] Only required if type == this.STEPPER.TYPE.FOUR_WIRE
 */

Board.prototype.stepperConfig = function(deviceNum, type, stepsPerRev, dirOrMotor1Pin, stepOrMotor2Pin, motor3Pin, motor4Pin) {
  var data = [
    START_SYSEX,
    STEPPER,
    0x00, // STEPPER_CONFIG from firmware
    deviceNum,
    type,
    stepsPerRev & 0x7F, (stepsPerRev >> 7) & 0x7F,
    dirOrMotor1Pin,
    stepOrMotor2Pin
  ];
  if (type === this.STEPPER.TYPE.FOUR_WIRE) {
    data.push(motor3Pin, motor4Pin);
  }
  data.push(END_SYSEX);
  this.sp.write(new Buffer(data));
};

/**
 * Asks the arduino to move a stepper a number of steps at a specific speed
 * (and optionally with and acceleration and deceleration)
 * speed is in units of .01 rad/sec
 * accel and decel are in units of .01 rad/sec^2
 * TODO: verify the units of speed, accel, and decel
 * @param {number} deviceNum Device number for the stepper (range 0-5)
 * @param {number} direction One of this.STEPPER.DIRECTION.*
 * @param {number} steps Number of steps to make
 * @param {number} speed
 * @param {number|function} accel Acceleration or if accel and decel are not used, then it can be the callback
 * @param {number} [decel]
 * @param {function} [callback]
 */

Board.prototype.stepperStep = function(deviceNum, direction, steps, speed, accel, decel, callback) {
  if (typeof accel === "function") {
    callback = accel;
    accel = 0;
    decel = 0;
  }

  var data = [
    START_SYSEX,
    STEPPER,
    0x01, // STEPPER_STEP from firmware
    deviceNum,
    direction, // one of this.STEPPER.DIRECTION.*
    steps & 0x7F, (steps >> 7) & 0x7F, (steps >> 14) & 0x7f,
    speed & 0x7F, (speed >> 7) & 0x7F
  ];
  if (accel > 0 || decel > 0) {
    data.push(
      accel & 0x7F, (accel >> 7) & 0x7F,
      decel & 0x7F, (decel >> 7) & 0x7F
    );
  }
  data.push(END_SYSEX);
  this.sp.write(new Buffer(data));
  this.once("stepper-done-" + deviceNum, callback);
};

/**
 * Send SYSTEM_RESET to arduino
 */

Board.prototype.reset = function() {
    newFrame.data=SYSTEM_RESET;
    this.sp.write(new Buffer(xbeeAPI.buildFrame(newFrame)));
  };

module.exports = {
  Board: Board,
  SYSEX_RESPONSE: SYSEX_RESPONSE,
  MIDI_RESPONSE: MIDI_RESPONSE
};
