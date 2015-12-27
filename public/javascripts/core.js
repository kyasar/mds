/**
 * Created by kadir on 17.12.2015.
 */
// public/core.js
var mainApp = angular.module('mainApp', ["ui.bootstrap", 'ui.map', 'ui.event']);

mainApp.factory('MainService', function ($rootScope) {
    var mem = {}
    var mdsURL = "http://localhost:8000";

    return {
        storeScope: function (key, value) {
            $rootScope.$emit('scope.stored', key);
            mem[key] = value;
        },
        getScope: function (key) {
            return mem[key];
        },
        getServerURL: function() {
            return mdsURL;
        }
    };
});
