var pairElement = document.getElementById('pair-device');
let bluetoothServer = {};

function getDevice() {
    navigator.bluetooth.requestDevice({filters: [{services: ['battery_service']}]})
        .then(device => {
            console.log("got device");
            device.addEventListener('gattserverdisconnected', onDisconnected);
            return device.gatt.connect()
        })
        .then(server => {
            console.log("got server");
            bluetoothServer = server;
            return server.getPrimaryService('battery_service');
        })
        .then(service => {
            console.log("got service");
            return service.getCharacteristic('battery_level');
        })
        .then(characteristic => {
            console.log("got notifications");
            return characteristic.startNotifications()
        })
        .then(characteristic => {
            console.log("got characteristic");
            onConnected();
            characteristic.addEventListener('characteristicvaluechanged', handleNottification);
            return characteristic.readValue();
        })
        .then(value => {
            console.log("got value");
            console.log('Battery percentage is ' + value.getUint8(0));
        })
        .catch(error => {
            onDisconnected();
            console.log(error);
        })
}

function onDisconnected() {
    console.log('disconnected');
    pairElement.innerHTML = 'Pair with device';
}

function onConnected() {
    pairElement.innerHTML = 'Paired';
}