bluetoothdevice = "";
function getDevice() {
    navigator.bluetooth.requestDevice({filters: [{services: ['battery_service']}]})
        .then(device => device.gatt.connect())
        .then(server => {
            // Getting Battery Service...
            return server.getPrimaryService('battery_service');
        })
        .then(service => {
            // Getting Battery Level Characteristic...
            return service.getCharacteristic('battery_level');
        })
        .then(characteristic => characteristic.startNotifications())
        .then(characteristic => {
            // Set up event listener for when characteristic value changes.
            characteristic.addEventListener('characteristicvaluechanged', handleBatteryLevelChanged);

            // Reading Battery Level...
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
    document.getElementById('battery-level').innerHTML = 'Battery level is: ' + batteryLevel;
    document.getElementById('battery-level').style = 'display: inline-block';
    console.log('Battery percentage is ' + batteryLevel);
}