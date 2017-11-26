var pairElement = document.getElementById('pair-device');
var commandInput = document.getElementById('input-command');
var logElement = document.getElementById('log');
var bluetoothServer = {};
var bluetoothDevice = {};
var bluetoothService = {};
var bluetoothWriteCharacteristic = {};
var bluetoothReadCharacteristic = {};

var serviceUUID = '0000fff0-0000-1000-8000-00805f9b34fb';
var characteristicWriteUUID = '0000fff2-0000-1000-8000-00805f9b34fb';
var characteristicReadUUID = '0000fff1-0000-1000-8000-00805f9b34fb';
var eolChar = "\r";

// var serviceUUID = '49535343-fe7d-4ae5-8fa9-9fafd205e445';
// var characteristicUUID = '49535343-fe7d-4ae5-8fa9-9fafd205e455';

function getDevice() {
    // navigator.bluetooth.requestDevice({acceptAllDevices: true})
    navigator.bluetooth.requestDevice({filters: [{services: [serviceUUID]}]})// , optionalServices: [serviceUUID]}]})
        .then(device => {
            console.log("got device");
            console.log(device);
            device.addEventListener('gattserverdisconnected', onDisconnected);
            bluetoothDevice = device;
            return device.gatt.connect()
        })
        .then(server => {
            console.log("got GATT server");
            bluetoothServer = server;
            return server.getPrimaryService(serviceUUID);
        })
        .then(service => {
            console.log("got serial port service");
            console.log(service);
            bluetoothService  = service;
            return service.getCharacteristic(characteristicReadUUID);
        })
        .then(characteristic => {
            console.log("got read characteristic");
            console.log(characteristic);
            bluetoothReadCharacteristic = characteristic;
            characteristic.addEventListener('characteristicvaluechanged', handleNottification);
            return characteristic.startNotifications()
        })
        .then(_ => {
            console.log("subscribed to reading notifications");
            return bluetoothService.getCharacteristic(characteristicWriteUUID);
        })
        .then(characteristic => {
            console.log("got write characteristic");
            console.log(characteristic);
            bluetoothWriteCharacteristic = characteristic;
            onConnected();
        })
        .catch(error => {
            onDisconnected();
            console.log('some error occured: ' + error);
        })
}

function encodeCommand(commandText) {
    var encoder = new TextEncoder('UTF-8');
    return encoder.encode(commandText);
}

function getCommandText() {
    var command = commandInput.value || 'AT I';
    return command + eolChar;
}

function writeToBluetooth() {
    var text = getCommandText();

    addRequestToLog(text);

    return bluetoothWriteCharacteristic.writeValue(encodeCommand(text)).then(value => {
        console.log("command successfully sent")
    }, error => {
        console.log('write error: ' + error);
    });
}

function addResponseToLog(logLine) {
    return  addLineToLog("<= " + logLine);
}

function addRequestToLog(logLine) {
    return addLineToLog( "=> " + logLine);
}

function addLineToLog(logLine) {
    logElement.innerHTML += logLine + "<br>";
    logElement.scrollTop = logElement.scrollHeight;
}

var convertValue = function (decodedValue) {
    var hexString = decodedValue.substr(6).replace(/\s/g, "");
    return parseInt(hexString, 16);
}

function handleNottification(event) {
    var value = event.target.value;
    var decoder = new TextDecoder('utf-8');
    var decodedValue = decoder.decode(value);
    console.log(decodedValue);

    if (decodedValue.startsWith("4")){
        addResponseToLog(decodedValue);
        addResponseToLog(convertValue(decodedValue));
    } else {
        addResponseToLog(decodedValue);
    }
}

function clearConsole() {
    logElement.innerHTML = "";
}
function onDisconnected() {
    console.log('disconnected');
    pairElement.innerHTML = 'Pair with device';
}

function onConnected() {
    pairElement.innerHTML = 'Paired';
}

document.getElementById("input-command").addEventListener("keyup", function (event) {
    if (event.keyCode == 13) {
        writeToBluetooth();
    }

});