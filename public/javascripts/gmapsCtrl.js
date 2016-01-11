/**
 * Created by kadir on 21.12.2015.
 */

mainApp.controller('gmapsCtrl', function($scope, $rootScope, $http, SharedProps) {
    $scope.mds = SharedProps.getServerURL();
    $scope.lat = "0";
    $scope.lng = "0";
    $scope.accuracy = "0";
    $scope.error = "";
    $scope.myMap = undefined;
    $scope.marketMarkers = [];
    $scope.centerChangedCntr = 0;
    $scope.currentCenter = undefined;

    console.log("gmaps ctrl..");

    $rootScope.$on('scanNearby', function (event, url) {
        console.log("message from productCtrl: " + url);

        return $http.get(url)
            .success(function(data) {
                //$scope.ma = data.product;
                $scope.markets = data.markets;
            })
            .error(function(data) {
                console.log('Error: ' + data);
            })
            .then(function(response) {
                console.log("THEN: " + response.data.markets);
                NProgress.done();
                $scope.showResults();
                return response.data.markets;
            });

    });

    $scope.showResult = function () {
        return $scope.error == "";
    };

    $scope.$on('$viewContentLoaded', function() {
        NProgress.done();
    });

    $scope.mapOptions = {
        center: new google.maps.LatLng($scope.lat, $scope.lng),
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        minZoom: 12,
        //maxZoom: 16,
        mapTypeControl: false
    };

    $scope.markerContentGenerator = function(marketName) {
        return "<div>" + marketName + "<br>" + "Price: $9.99" + "</div>";
    };

    //Markers should be added after map is loaded
    $scope.showMarkets = function() {
        // Clean previous markers on the map
        $scope.deleteMarkers();

        $scope.markets.forEach(function(m) {
            //console.log("M: " + m.name + " " + m.loc.coordinates[0] + " " + m.loc.coordinates[1]);

            var marker = new google.maps.Marker(
                {   map: $scope.myMap,
                    position: new google.maps.LatLng(m.loc.coordinates[0], m.loc.coordinates[1]),
                    icon: "images/market_marker.png",
                    title: m.name,
                    market: m   // market contains market object - extra data
                });

            marker.addListener('click', function() {
                var infowindow = new google.maps.InfoWindow({
                    content: $scope.markerContentGenerator(m.name)
                });

                console.log("Marker clicked: " + marker.title);
                infowindow.open($scope.myMap, marker);
            });

            // Push marker to markers array
            window.setTimeout(function() {
                $scope.marketMarkers.push(marker);
            }, 500);
        });
    };

    //Markers should be added after map is loaded
    $scope.showResults = function() {
        // Clean previous markers on the map
        $scope.deleteMarkers();

        $scope.markets.forEach(function(m) {
            //console.log("M: " + m.name + " " + m.loc.coordinates[0] + " " + m.loc.coordinates[1]);

            var div = document.createElement('DIV');
            div.innerHTML = '<div class="marker-container"><div class="market-marker"><span>$ <strong>999.999</strong></span></div></div>';

            var marker = new RichMarker(
                {   map: $scope.myMap,
                    position: new google.maps.LatLng(m.loc.coordinates[0], m.loc.coordinates[1]),
                    title: m.name,
                    content: div,
                    shadow: '0 0 0 0',
                    market: m   // market contains market object - extra data
                });

            marker.addListener('click', function() {
                var infowindow = new google.maps.InfoWindow({
                    content: $scope.markerContentGenerator(m.name)
                });

                console.log("Marker clicked: " + marker.title);
                infowindow.open($scope.myMap, marker);
            });

            // Push marker to markers array
            window.setTimeout(function() {
                $scope.marketMarkers.push(marker);
            }, 500);
        });
    };

    $scope.drawCircle = function(center, radius) {
        var cityCircle = new google.maps.Circle({
            strokeColor: '#FF0000',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#FF0000',
            fillOpacity: 0.35,
            map: $scope.myMap,
            center: center,
            radius: radius
        });
    };

    $scope.onMapIdle = function() {
        var newCenter = $scope.myMap.getCenter();
        var zoom = $scope.myMap.getZoom();

        if (newCenter === undefined)
            return;

        var ne = $scope.myMap.getBounds().getNorthEast();
        var sw = $scope.myMap.getBounds().getSouthWest();

        var hypotenuse = google.maps.geometry.spherical.computeDistanceBetween(ne, sw);
        console.log("Hypotenuse: " + hypotenuse + " r: " + hypotenuse/2);

        var centerDiff = google.maps.geometry.spherical.computeDistanceBetween(newCenter, $scope.currentCenter);

        console.log("Center Diff: " + centerDiff);
        if (centerDiff >= (hypotenuse/2) || $scope.centerChangedCntr == 0)
        {
            console.log("Center is updated to: " + newCenter);
            $scope.centerChangedCntr++;
            $scope.currentCenter = newCenter;
            //$scope.drawCircle(newCenter, hypotenuse/2);
            $scope.getNearbyMarkets(newCenter.lat(), newCenter.lng(), hypotenuse);

            /*
                Share new center and range with other controllers
             */
            SharedProps.setMapCenter(newCenter);
            SharedProps.setMaxDist(hypotenuse);
        }
    };

    // Sets the map on all markers in the array.
    $scope.setMapOnAll = function (map) {
        for (var i = 0; i < $scope.marketMarkers.length; i++) {
            $scope.marketMarkers[i].setMap(map);
        }
    };

    // Removes the markers from the map, but keeps them in the array.
    $scope.clearMarkers = function() {
        $scope.setMapOnAll(null);
    };

    // Deletes all markers in the array by removing references to them.
    $scope.deleteMarkers = function() {
        $scope.clearMarkers();
        $scope.marketMarkers = [];
    };

    $scope.getNearbyMarkets = function(lat, long, dist) {

        var queryURL = $scope.mds + "/mds/api/market/nearby?" + "lat=" + lat + "&long=" + long + "&max_dist=" + dist + "&token=test&api_key=test";
        //console.log("REQ: " + queryURL);

        return $http.get(queryURL)
            .success(function(data) {
                $scope.markets = data.markets;
                console.log(data);
            })
            .error(function(data) {
                console.log('Error: ' + data);
            })
            .then(function(response) {
                $scope.showMarkets();
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
        $scope.myMap.setCenter(latlng);
        $scope.currentCenter = latlng;      // save initial location

        /*
        When zoom is changed by user, this callback will be invoked
         */
        $scope.myMap.addListener('zoom_changed', function() {
            //console.log('Zoom: ' + $scope.myMap.getZoom());
        });
        //$scope.marketMarkers.push(new google.maps.Marker({ map: $scope.myMap, position: latlng }));
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
        /*
            HTML5 Geo-Location support
         */
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition($scope.showPosition, $scope.showError);
        }
        else {
            $scope.error = "Geolocation is not supported by this browser.";
        }
    };

    $scope.getLocation();
});

