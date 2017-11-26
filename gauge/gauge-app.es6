var pairElement = document.getElementById('pair-device');
var bluetoothServer = {};
var bluetoothDevice = {};
var bluetoothService = {};
var bluetoothWriteCharacteristic = {};
var bluetoothReadCharacteristic = {};
var gauge= {};

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

function writeToBluetooth(text) {
    return bluetoothWriteCharacteristic.writeValue(encodeCommand(text)).then(value => {
        console.log("command successfully sent")
    }, error => {
        console.log('write error: ' + error);
    });
}


var convertValue = function (decodedValue) {
    var hexString = decodedValue.substr(6).replace(/\s/g, "");
    return parseInt(hexString, 16) / 4;
}

function changeGauge(decodedValue) {
    gauge.refresh(decodedValue);
}


function handleNottification(event) {
    var value = event.target.value;
    var decoder = new TextDecoder('utf-8');
    var decodedValue = decoder.decode(value);
    console.log(decodedValue);
    if (decodedValue.startsWith("4")){
        changeGauge(decodedValue);
    }
}

function onDisconnected() {
    console.log('disconnected');
    pairElement.innerHTML = 'Pair with device';
}

function onConnected() {
    pairElement.innerHTML = 'Paired';

    gauge = new JustGage({
        id: "gauge",
        value: 0,
        min: 0,
        max: 6000,
        title: "Engine RPM"
    });

    writeToBluetooth("AT E0");

    setInterval(function () {
        writeToBluetooth("01 0c");
    }, 50);
}