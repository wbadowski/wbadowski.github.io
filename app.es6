let bluetoothDevice = {};
let bluetoothServer = {};

function getDevice() {
    navigator.bluetooth.requestDevice({filters: [{services: ['battery_service']}]})
        .then(device => device.gatt.connect())
        .then(server => {
            bluetoothServer = server;
            return server.getPrimaryService('battery_service');
        })
        .then(service => {
            return service.getCharacteristic('battery_level');
        })
        .then(characteristic => characteristic.startNotifications())
        .then(characteristic => {
            document.getElementById('battery-level').style = 'display: inline-block';
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
    document.getElementById('battery-level').innerHTML = 'Battery level is: ' + batteryLevel + '%';

    console.log('Battery percentage is ' + batteryLevel);
}