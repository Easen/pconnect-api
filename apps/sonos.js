var Sonos = require('sonos');
var _ = require('underscore');

var search = function() {
    var devices = new Array();
    var search = Sonos.search();
    search.on('DeviceAvailable', function (device, model) {
        devices.push(device);
    });
    return devices;
};

var devices = search();


module.exports = {
    title: 'Sonos',
    actions: {
        pause: {
            title: 'Pause'
        },
        play: {
            title: 'Play'
        },
        next: {
            title: 'Next'
        }
    },
    invokeAction: function (id) {
        console.log(id, devices);
        _.each(devices, function(device) {
            device[id].call(device);
        });

        return [201];
    }
};