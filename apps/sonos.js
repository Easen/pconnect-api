var sonos = require('sonos');
var Q = require('q');
var _ = require('underscore');
var debug = require('debug')('pconnect:sonos');

var TIMEOUT = 5000;
var devices = [];

function getZones(deviceList) {
    var zones = []
    deviceList.forEach(function (device) {
        if (zones.indexOf(device.CurrentZoneName) === -1 && device.CurrentZoneName !== 'BRIDGE' && undefined !== device.CurrentZoneName) {
            zones.push(device.CurrentZoneName)
        }
    })
    return zones;
}

function getZoneDevices(zone, deviceList) {
    var zoneDevices = []
    deviceList.forEach(function (device) {
        if (device.CurrentZoneName === zone) {
            zoneDevices.push(device)
        }
    })
    return zoneDevices;
}

function getZoneCoordinator(zone, deviceList) {
    var coordinator;
    deviceList.forEach(function (device) {
        if (device.CurrentZoneName === zone && device.coordinator === 'true') {
            coordinator = device;
        }
    })
    return coordinator;
}


var search = function () {
    var devices = new Array();
    var search = sonos.search();
    search.on('DeviceAvailable', function (device, model) {
        devices.push(device);
    });
    return devices;
};

var devices = search();
var SonosApp = function (zone, coordinator, devices) {
    this.zone = zone;
    this.coordinator = coordinator;
    this.devices = devices;
};
SonosApp.prototype = {
    zone: null,
    coordinator: null,
    devices: [],
    title: function () {
        return 'Sonos - ' + this.zone;
    },
    actions: function () {
        return {
            pause: {
                title: 'Pause'
            },
            play: {
                title: 'Play'
            },
            next: {
                title: 'Next'
            },
            previous: {
                title: 'Previous'
            },
            increaseVol: {
                title: 'Vol +'
            },
            decreaseVol: {
                title: 'Vol -'
            }
        }
    },
    invokeAction: function (action) {
        debug('Received action [%s]', action);

        var self = this;
        return Q.Promise(function (resolve) {
            var volumneStep = undefined;
            switch (action) {
                case 'decreaseVol':
                    volumneStep = -3;
                case 'increaseVol':
                    if (volumneStep === undefined) {
                        volumneStep = 3;
                    }
                    self.coordinator.getVolume(function (error, vol) {
                        vol += volumneStep;

                        if (vol > 100) {
                            vol = 100;
                        } else if (vol < 0) {
                            vol = 0;
                        }

                        self.coordinator.setVolume(vol, function () {
                            resolve(202);
                        });
                    });
                    break;
                default:
                    self.coordinator[action].call(self.coordinator);
                    resolve(202);
            }
        });
    }
};

var loadAllDevices = Q.Promise(function (resolve) {
    var devices = new Array();
    debug('Looking for Sonos devices...');
    sonos.search({timeout: TIMEOUT}, function (device, model) {
        debug('Received Sonos device [%s]', device.host);

        var data = {ip: device.host, port: device.port, model: model, device: device}
        device.getZoneAttrs(function (err, attrs) {
            if (!err) {
                _.extend(data, attrs);
            }
            device.getZoneInfo(function (err, info) {
                if (!err) {
                    _.extend(data, info);
                }
                device.getTopology(function (err, info) {
                    if (!err) {
                        info.zones.forEach(function (group) {
                            if (group.location === 'http://' + data.ip + ':' + data.port + '/xml/device_description.xml') {
                                _.extend(data, group);
                            }
                        })
                    }
                    devices.push(data);
                });
            });
        });
    });

    setTimeout(function() {
        resolve(devices);
    }, TIMEOUT + 1000);
});



module.exports.loadApp = Q.Promise(function (resolve) {
    loadAllDevices.then(function(devices) {
        var zones = new Array();
        getZones(devices).forEach(function (zone) {
            var coordinator = getZoneCoordinator(zone, devices);
            zones.push(
                new SonosApp(
                    zone,
                    coordinator.device,
                    getZoneDevices(zone, devices)
                )
            );
        });
        resolve(zones);
        debug('Resolved Sonos zones');
    });
});
