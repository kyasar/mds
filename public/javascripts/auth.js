/**
 * Created by kadir on 17.12.2015.
 */
// public/core.js
var authApp = angular.module('authApp', ['ui.bootstrap', 'environment']);

authApp.run(function ($rootScope) {
    console.log("AuthApp run");
});

authApp.config(function(envServiceProvider) {
    console.log("Config run");
    // set the domains and variables for each environment
    envServiceProvider.config({
        mdsURL: {
            development: ['localhost', 'dev.local'],
            production: ['markod.net']
        },
        vars: {
            development: {
                apiUrl: 'http://localhost:8000'
            },
            production: {
                apiUrl: 'http://www.markod.net'
            }
        }
    });

    // run the environment check, so the comprobation is made
    // before controllers and services are built
    envServiceProvider.check();
});

authApp.factory('SharedProps', function ($rootScope, envService) {
    var mem = {};
    //envService.set('production'); // will set 'production' as current environment
    var environment = envService.get(); // gets 'development'
    console.log("Current version: ", environment);

    var mapCenter = undefined;
    var max_dist = undefined;
    var barcode = undefined;
    var productSearched = false;    // initially no product is searched

    console.log("SharedProps service created..");
    return {
        getScope: function (key) {
            return mem[key];
        },
        getServerURL: function() {
            return mdsURL;
        },
        getMapCenter: function() {
            return mapCenter;
        },
        setMapCenter: function(center) {
            mapCenter = center;
        },
        getMaxDist: function() {
            return max_dist;
        },
        setMaxDist: function(dist) {
            max_dist = dist;
        },
        getProductBarcode: function() {
            return barcode;
        },
        setProductBarcode: function(b) {
            barcode = b;
        },
        getProductSearched: function() {
            return productSearched;
        },
        setProductSearched: function(b) {
            productSearched = b;
        }
    };
});

authApp.controller('loginCtrl', function($scope, $rootScope, $http, $window, SharedProps, envService) {
    $scope.mds = envService.read('apiUrl'); // SharedProps.getServerURL();

    console.log("loginCtrl running..");

    $scope.logMeIn = function () {
        console.log("REQ: " + $scope.mds + "/login");
        console.log("email: " + $scope.email + " password: " + $scope.passwd);

        return $http({
                url: $scope.mds + '/login',
                dataType: "json",
                method: "POST",
                data: {
                    email: $scope.email,
                    password: $scope.passwd
                    },
                headers: {'Content-Type': 'application/json'}
            })
            .success(function(data) {
                console.log("data.status: ", data.status);
                if (data.status == "OK") {
                    console.log("Login successful.");
                    // TODO: If admin redirect to admin page
                    if (data.redirect != undefined) {
                        console.log("redirecting to " + data.redirect);
                        $window.location.href = data.redirect;
                    }
                } else {
                    console.log("Login NOT successful.");
                }
            })
            .error(function(data) {
                console.log('Error: ' + data);
            })
            .then(function(response) {
                return response.data;
            });
    };
});