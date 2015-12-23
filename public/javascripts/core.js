/**
 * Created by kadir on 17.12.2015.
 */
// public/core.js
var mainApp = angular.module('mainApp', ["ui.bootstrap", 'ui.map', 'ui.event', 'uiGmapgoogle-maps']);

mainApp.config(function(uiGmapGoogleMapApiProvider) {
    console.log("Main App config.");
    uiGmapGoogleMapApiProvider.configure({
        key: 'AIzaSyAhujYJ3rPc_91Y5qi0ah7FHMKUkk9AOl0',
        v: '3.20', //defaults to latest 3.X anyhow
        libraries: 'weather,geometry,visualization'
    });
});

mainApp.controller('mapCtrl', function($scope) {
    $scope.map = {center: {latitude: 51.219053, longitude: 4.404418 }, zoom: 14 };
    $scope.options = {scrollwheel: false};

    /*
     This callback function is invoked when current location is acquired
     */
    $scope.showPosition = function (position) {
        $scope.lat = position.coords.latitude;
        $scope.lng = position.coords.longitude;
        $scope.accuracy = position.coords.accuracy;
        $scope.$apply();

        console.log("lat: " + $scope.lat + " long: " + $scope.lng);

        var latlng = new google.maps.LatLng($scope.lat, $scope.lng);
        //$scope.model.myMap.setCenter(latlng);
        //$scope.myMarkers.push(new google.maps.Marker({ map: $scope.model.myMap, position: latlng }));
        //$scope.center = {latitude: $scope.lat, longitude: $scope.lng};
        $scope.map.center = {latitude: $scope.lat, longitude: $scope.lng};
    };

    $scope.showError = function (error) {
        switch (error.code) {
            case error.PERMISSION_DENIED:
                $scope.error = "User denied the request for Geolocation."
                break;
            case error.POSITION_UNAVAILABLE:
                $scope.error = "Location information is unavailable."
                break;
            case error.TIMEOUT:
                $scope.error = "The request to get user location timed out."
                break;
            case error.UNKNOWN_ERROR:
                $scope.error = "An unknown error occurred."
                break;
        }
        $scope.$apply();
    };

    $scope.getLocation = function () {
        console.log("getting current location..");
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition($scope.showPosition, $scope.showError);
        }
        else {
            $scope.error = "Geolocation is not supported by this browser.";
        }
    };

    $scope.getLocation();
});