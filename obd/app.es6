var pairElement = document.getElementById('pair-device');
let bluetoothServer = {};
let bluetoothDevice = {};
let bluetoothService = {};
let bluetoothWriteCharacteristic = {};
let bluetoothReadCharacteristic = {};


var serviceUUID = '0000fff0-0000-1000-8000-00805f9b34fb';
var characteristicWriteUUID = '0000fff2-0000-1000-8000-00805f9b34fb';
var characteristicReadUUID = '0000fff1-0000-1000-8000-00805f9b34fb';



// var serviceUUID = '49535343-fe7d-4ae5-8fa9-9fafd205e445';
// var characteristicUUID = '49535343-fe7d-4ae5-8fa9-9fafd205e455';

function getDevice() {
    // navigator.bluetooth.requestDevice({acceptAllDevices: true})
    navigator.bluetooth.requestDevice({filters: [{services: [serviceUUID]}]})// , optionalServices: [serviceUUID]}]})
        .then(device => {
            console.log("got device");

            device.addEventListener('gattserverdisconnected', onDisconnected);
            bluetoothDevice = device;
            return device.gatt.connect()
        })
        .then(server => {
            console.log("got server");
            bluetoothServer = server;
            return server.getPrimaryService(serviceUUID);
        })
        .then(service => {
            console.log("got service");
            console.log(arguments);
            console.log(service);
            bluetoothService  = service;
            return service.getCharacteristic(characteristicReadUUID);
        })
        .then(characteristic => {
            console.log("got notifications");
            bluetoothReadCharacteristic = characteristic;
            characteristic.addEventListener('characteristicvaluechanged', handleBatteryLevelChanged);
            return characteristic.startNotifications()
        })
        .then(_ => {
            return bluetoothService.getCharacteristic(characteristicWriteUUID);
        })
        .then(characteristic => {
            console.log("got characteristic");
            onConnected();
            bluetoothWriteCharacteristic = characteristic;

            let encoder = new TextEncoder('UTF-8');
            let text = encoder.encode('AT @1\r');


            return characteristic.writeValue(text).
                then(value => {
                    console.log(value);
                }, error => {

                    console.log('write error' + error);
                });

        })
        .then(value => {
            console.log("got value");
            console.log(value);
        })
        .catch(error => {
            // onDisconnected();
            console.log('my bad' + error);
        })
}

function getCharacteristic() {
        bluetoothService.getCharacteristic(characteristicReadUUID)
        .then(characteristic => {
            console.log("got notifications");
            characteristic.addEventListener('characteristicvaluechanged', handleBatteryLevelChanged);
            return characteristic.startNotifications()
        })
        .catch(error => {
            // onDisconnected();
            console.log(error);
        })
}

function handleBatteryLevelChanged(event) {

    console.log(event.target.value);
}

function onDisconnected() {
    console.log('disconnected');
    pairElement.innerHTML = 'Pair with device';
}

function onConnected() {
    pairElement.innerHTML = 'Paired';
}