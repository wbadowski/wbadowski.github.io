var pairElement = document.getElementById('pair-device');
var bluetoothServer = {};
var bluetoothDevice = {};
var bluetoothService = {};
var bluetoothWriteCharacteristic = {};
var bluetoothReadCharacteristic = {};
var transmitting = false;
var repeatJobID;

var serviceUUID             = '0000fff0-0000-1000-8000-00805f9b34fb';
var characteristicReadUUID  = '0000fff1-0000-1000-8000-00805f9b34fb';
var characteristicWriteUUID = '0000fff2-0000-1000-8000-00805f9b34fb';
var eolChar = "\r";
var encoder = new TextEncoder('UTF-8');

var rpmMin = 0;
var rpmMax = 16000;
var rpmDefault = 0;

var gauge = new JustGage({
    id: "gauge",
    value: rpmDefault,
    min: rpmMin,
    max: rpmMax,
    title: "Engine RPM",
    animationSpeed: 60,
});

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
        .then(() => {
            console.log("subscribed to reading notifications");
            return bluetoothService.getCharacteristic(characteristicWriteUUID);
        })
        .then(characteristic => {
            console.log("got write characteristic");
            console.log(characteristic);
            bluetoothWriteCharacteristic = characteristic;
        })
        .then(onConnected)
        .catch(error => {
            onDisconnected();
            console.log('some error occured: ' + error);
        })
}

function onConnected() {
    prepareDevice();
    setTimeout(function () {
        pairElement.innerHTML = 'Paired';
        repeatJobID = setInterval(function () {
            writeToBluetooth("01 0c");
        }, 300);
    }, 1300);
}

function writeToBluetooth(text) {
    if (!isTransmitting()) {
        transmittingStarted();
        console.log("sent: " + text);
        return bluetoothWriteCharacteristic.writeValue(encodeCommand(text)).then(value => {
            console.log("command successfully sent")
        }, error => {
            console.log('write error: ' + error);
        });
    }
}

function handleNottification(event) {
    transmittingStopped();
    var value = event.target.value;
    var decoder = new TextDecoder('utf-8');
    var decodedValue = decoder.decode(value);
    console.log(decodedValue);
    if (decodedValue.startsWith("4")){
        changeGauge(convertValue(decodedValue));
    }
}

function onDisconnected() {
    console.log('disconnected');
    pairElement.innerHTML = 'Pair with device';
}

function prepareDevice() {
    writeToBluetooth("AT Z");
    setTimeout(function () {writeToBluetooth("ATE0")}, 300);
    setTimeout(function () {writeToBluetooth("ATH0")}, 300);
    setTimeout(function () {writeToBluetooth("ATSP0")}, 300);
}

function encodeCommand(commandText) {
    return encoder.encode(commandText + eolChar);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


function convertValue(decodedValue) {
    var hexString = decodedValue.substr(6).replace(/\s/g, "");

    if (hexString.length > 4){
        hexString = hexString.substr(0,4);
    }
    return parseInt(hexString, 16) / 4;
}

function changeGauge(decodedValue) {
    gauge.refresh(decodedValue);
}

function isTransmitting() {
    return transmitting;
}

function transmittingStopped() {
    transmitting = false;
}

function transmittingStarted() {
    transmitting = true;
}

function stopDemo() {
    clearTimeout(repeatJobID);
}