/**
 * Created by kadir on 17.12.2015.
 */
// public/core.js
var markodApp = angular.module('markodMP', ["ui.bootstrap"]);

markodApp.controller('productSearchCtrl', function($scope, $http) {
    $scope.searchText = "";

    /*
    $http.get('/mds/api/test')
        .success(function(data) {
            $scope.products = data;
            console.log(data);
        })
        .error(function(data) {
            console.log('Error: ' + data);
        });
        */

    // current location
    $scope.loc = { lat: 40, lon: -73 };
    $scope.gotoCurrentLocation = function () {
        console.log("GOTO Curr loc");
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(function (position) {
                var c = position.coords;
                $scope.gotoLocation(c.latitude, c.longitude);
            });
            return true;
        }
        return false;
    };
    $scope.gotoLocation = function (lat, lon) {
        if ($scope.lat != lat || $scope.lon != lon) {
            $scope.loc = { lat: lat, lon: lon };
            if (!$scope.$$phase) $scope.$apply("loc");
        }
    };

    $scope.queryProducts = function(searchText) {
        console.log("REQ: /mds/api/products?api_key=test&search=" + searchText);
        console.log("VAL: " + searchText);
        return $http.get('/mds/api/products?api_key=test&search=' + searchText)
            .success(function(data) {
                $scope.products = data.product;
                console.log(data);
            })
            .error(function(data) {
                console.log('Error: ' + data);
            })
            .then(function(response) {
                console.log("THEN: " + response.data.product);
                return response.data.product;
            });
    };

    $scope.onProductSelect = function(item, model, label) {
        console.log("item : " + JSON.stringify(item));
        console.log("model: " + JSON.stringify(model));
        console.log("label: " + label);
    };

});
