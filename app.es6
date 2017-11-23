let bluetoothDevice = {};
let bluetoothServer = {};

function getDevice() {
    navigator.bluetooth.requestDevice({filters: [{services: ['battery_service']}]})
        .then(device => {
            device.addEventListener('gattserverdisconnected', onDisconnected);
            return device.gatt.connect()
        })
        .then(server => {
            bluetoothServer = server;
            return server.getPrimaryService('battery_service');
        })
        .then(service => {
            return service.getCharacteristic('battery_level');
        })
        .then(characteristic => characteristic.startNotifications())
        .then(characteristic => {
            document.getElementById('battery-level').style = 'display: block';
            characteristic.addEventListener('characteristicvaluechanged', handleBatteryLevelChanged);
            return characteristic.readValue();
        })
        .then(value => {
            console.log('Battery percentage is ' + value.getUint8(0));
        })
        .catch(error => {
            console.log(error);
        })
}

function handleBatteryLevelChanged(event) {
    let batteryLevel = event.target.value.getUint8(0);
    var valueElement = document.getElementById('battery-level');
    valueElement.innerHTML = 'Battery level is: ' + batteryLevel + '%';
    var background = percentageToHsl(batteryLevel/100, 20, 100);
    valueElement.style = 'display: block; background-color: ' + background;

    console.log('Battery percentage is ' + batteryLevel);
}

function onDisconnected() {
    console.log('disconnected')
    document.getElementById('battery-level').style = 'display: none';
}

function percentageToHsl(percentage, hue0, hue1) {
    var hue = (percentage * (hue1 - hue0)) + hue0;
    return 'hsl(' + hue + ', 100%, 50%)';
}