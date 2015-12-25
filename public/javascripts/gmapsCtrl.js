/**
 * Created by kadir on 21.12.2015.
 */

mainApp.controller('gmapsCtrl', function($scope, $http) {
    $scope.mds = "http://localhost:8000";
    $scope.distance = 1000;

    $scope.lat = "0";
    $scope.lng = "0";
    $scope.accuracy = "0";
    $scope.error = "";
    $scope.model = { myMap: undefined };
    $scope.marketMarkers = [];

    console.log("gmaps ctrl..");

    $scope.showResult = function () {
        return $scope.error == "";
    };

    $scope.mapOptions = {
        center: new google.maps.LatLng($scope.lat, $scope.lng),
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    //Markers should be added after map is loaded
    $scope.showMarkets = function() {
        console.log("showMarkets func.");

        $scope.marketMarkers.push(new google.maps.Marker({ map: $scope.model.myMap, position: new google.maps.LatLng(39.89395, 32.80209) }));
        $scope.marketMarkers.push(new google.maps.Marker({ map: $scope.model.myMap, position: new google.maps.LatLng(39.89495, 32.80309) }));
        //var latlng = new google.maps.LatLng(39.89395, 32.80209);
        //$scope.model.myMap.setCenter(latlng);
        //$scope.marketMarkers.push(new google.maps.Marker({ map: $scope.model.myMap, position: latlng }));
    };

    $scope.onMapIdle = function(m) {
        console.log("onMapIdle func.");

        $scope.showMarkets();
    };

    $scope.markerClicked = function(m) {
        console.log("marker clicked.");
        window.alert("clicked");
    };

    $scope.getNearbyMarkets = function(lat, long) {
        var queryURL = $scope.mds + "/mds/api/market/nearby?" + "lat=" + lat + "&long=" + long + "&max_dist=" + $scope.distance + "&token=test&api_key=test";
        console.log("REQ: " + queryURL);

        return $http.get(queryURL)
            .success(function(data) {
                $scope.markets = data.markets;
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
        $scope.model.myMap.setCenter(latlng);

        $scope.getNearbyMarkets($scope.lat, $scope.lng, 600);

        //$scope.marketMarkers.push(new google.maps.Marker({ map: $scope.model.myMap, position: latlng }));
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

