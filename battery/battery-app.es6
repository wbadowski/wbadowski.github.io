var valueElement = document.getElementById('battery-level');
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
            characteristic.addEventListener('characteristicvaluechanged', handleBatteryLevelChanged);
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

function handleBatteryLevelChanged(event) {
    let batteryLevel = event.target.value.getUint8(0);
    var background = percentageToHsl(batteryLevel/100, 20, 100);
    valueElement.innerHTML = 'Battery level is: ' + batteryLevel + '%';
    valueElement.style = 'display: block; background-color: ' + background;

    console.log('Battery percentage is ' + batteryLevel);
}

function onDisconnected() {
    console.log('disconnected');
    valueElement.style = 'display: none';
    pairElement.innerHTML = 'Pair with device';
}

function onConnected() {
    valueElement.style = 'display: block';
    pairElement.innerHTML = 'Paired';
}

function percentageToHsl(percentage, hue0, hue1) {
    var hue = (percentage * (hue1 - hue0)) + hue0;
    return 'hsl(' + hue + ', 100%, 50%)';
}