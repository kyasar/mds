/**
 * Created by kadir on 21.12.2015.
 */

mainApp.controller('gmapsCtrl', function($scope, $rootScope, $http, $uibModal, SharedProps, envService) {
    $scope.mds = envService.read('apiUrl'); // SharedProps.getServerURL();
    $scope.lat = "0";
    $scope.lng = "0";
    $scope.accuracy = "0";
    $scope.error = "";
    $scope.myMap = undefined;
    $scope.marketMarkers = [];
    $scope.centerChangedCntr = 0;
    $scope.currentCenter = undefined;
    $scope.zoom = undefined;
    $scope.locationAllowed = false;

    console.log("gmaps ctrl..");

    getNearbyMarkets = function () {
        var queryURL = $scope.mds + "/mds/api/market/nearby?";
        var mapCenter = SharedProps.getMapCenter();
        //console.log("Lat: " + mapCenter.lat() + " Long: " + mapCenter.lng());
        //console.log("Range: " + SharedProps.getMaxDist());

        queryURL += "lat=" + mapCenter.lat() + "&long=" + mapCenter.lng();
        queryURL += "&max_dist=" + SharedProps.getMaxDist() + "&token=test&api_key=test";

        //console.log("REQ: " + queryURL);
        return $http.get(queryURL)
            .success(function (data) {
                $scope.markets = data.markets;
                console.log(data);
            })
            .error(function (data) {
                console.log('Error: ' + data);
            })
            .then(function (response) {
                if (response.data.markets.length > 0) {
                    $scope.showMarkets();
                } else {
                    console.log("No market found.");
                    $scope.noMarketFoundBox();
                }
                return response.data.markets;
            });
    };

    scanNearbyMarkets = function () {
        var url = "mds/api/scannearby/?";
        var mapCenter = SharedProps.getMapCenter();
        //console.log("Lat: " + mapCenter.lat() + " Long: " + mapCenter.lng());
        //console.log("Range: " + SharedProps.getMaxDist());

        url += "lat=" + mapCenter.lat() + "&long=" + mapCenter.lng();
        url += "&barcode=" + SharedProps.getProductBarcode();
        url += "&max_dist=" + SharedProps.getMaxDist() + "&api_key=test";

        //console.log("Req. URL: " + url);
        return $http.get(url)
            .success(function (data) {
                $scope.markets = data.markets;
                console.log(data);
            })
            .error(function (data) {
                console.log('Error: ' + data);
            })
            .then(function (response) {
                NProgress.done();
                if (response.data.markets.length > 0) {
                    $scope.showResults();
                } else {
                    console.log("No product found.");
                    $scope.noProductFoundBox();
                }
                return response.data.markets;
            });
    };

    $rootScope.$on('scanNearby', function (event) {
        scanNearbyMarkets();
    });

    $scope.$on('$viewContentLoaded', function () {
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

    markerInfoWindowGenerator = function (market) {
        return "<div><h5>" + market.name + "</h5>" + market.vicinity + "</div>";
    };

    closeInfoWindows = function () {
        $scope.marketMarkers.forEach(function (m) {
            m.infowindow.close();
        });
    };

    makeResultMarkersUnfocused = function () {
        $scope.marketMarkers.forEach(function (m) {
            m.setContent(null);
            m.setContent(m.unfocused);
        });
    };

    /*
     Shows markers of any market on the range
     */
    $scope.showMarkets = function () {
        // Clean previous markers on the map
        deleteMarkers();

        $scope.markets.forEach(function (m) {
            //console.log("M: " + m.name + " " + m.loc.coordinates[0] + " " + m.loc.coordinates[1]);

            var marker = new google.maps.Marker(
                {
                    map: $scope.myMap,
                    position: new google.maps.LatLng(m.loc.coordinates[0], m.loc.coordinates[1]),
                    icon: "images/market_marker.png",
                    title: m.name,
                    market: m   // market contains market object - extra data
                });

            marker.infowindow = new google.maps.InfoWindow({
                content: markerInfoWindowGenerator(m)
            });

            marker.addListener('click', function () {
                closeInfoWindows();

                console.log("Marker clicked: " + marker.title);
                marker.infowindow.open($scope.myMap, marker);
            });

            // Push marker to markers array
            $scope.marketMarkers.push(marker);
        });
    };

    /*
     Shows markers of markets containing products requested
     */
    $scope.showResults = function () {
        // Clean previous markers on the map
        deleteMarkers();
        SharedProps.setProductSearched(true);   // a product search is requested

        $scope.markets.forEach(function (m) {
            console.log("M: " + m.name + " price: " + m.products[0].price);
            var price = m.products[0].price;
            var div = document.createElement('DIV');
            div.innerHTML = '<div class="marker-container">' +
            '<div class="market-marker"><span><strong>₺ ' + price + '</strong></span></div></div>';

            var divFocused = document.createElement('DIV');
            divFocused.innerHTML = '<div class="marker-container">' +
            '<div class="market-marker-clicked"><span><strong>₺ ' + price + '</strong></span></div></div>';

            var marker = new RichMarker(
                {
                    map: $scope.myMap,
                    position: new google.maps.LatLng(m.loc.coordinates[0], m.loc.coordinates[1]),
                    title: m.name,
                    content: div,
                    focused: divFocused,    // focused content on marker clicked
                    unfocused: div,
                    shadow: '0 0 0 0',
                    market: m,   // market contains market object - extra data
                    price: price
                });

            marker.infowindow = new google.maps.InfoWindow({
                content: markerInfoWindowGenerator(m)
            });

            marker.addListener('click', function () {
                closeInfoWindows();
                makeResultMarkersUnfocused();

                marker.setContent(marker.focused);

                console.log("Marker clicked: " + marker.title);
                marker.infowindow.open($scope.myMap, marker);
            });

            // Push marker to markers array
            $scope.marketMarkers.push(marker);
        });

        /*
         Show slider where results are listed.
         */
        /* if ($scope.markets.length)
            slider.slideReveal("show")
            */
    };

    $scope.leftPanelResultClicked = function (marker) {

        /*
         Show clicked market infowindow only
         */
        closeInfoWindows();

        if (!SharedProps.getProductSearched()) {
            console.log("LP item clicked: " + marker.market.name);
            $scope.marketMarkers.forEach(function (m) {
                if (m.getAnimation() != null) {
                    m.setAnimation(null);
                }
            });

            /*
             Center clicked market on map
             */
            $scope.myMap.panTo(marker.position);

            if (marker.getAnimation() != null) {
                marker.setAnimation(null);
            } else {
                marker.setAnimation(google.maps.Animation.BOUNCE);
            }
        } else {
            $scope.myMap.panTo(marker.position);

            makeResultMarkersUnfocused();
            marker.setContent(marker.focused);

            console.log("LP result item clicked: " + marker.market.name);
        }
    };

    $scope.drawCircle = function (center, radius) {
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

    $scope.onMapIdle = function () {
        var newCenter = $scope.myMap.getCenter();
        var newZoom = $scope.myMap.getZoom();
        var zoomChanged = false;

        if (newCenter == undefined || $scope.locationAllowed == false) {
            console.log("No map center captured !!");
            return;
        }

        var ne = $scope.myMap.getBounds().getNorthEast();
        var sw = $scope.myMap.getBounds().getSouthWest();

        var hypotenuse = google.maps.geometry.spherical.computeDistanceBetween(ne, sw);
        var centerDiff = 0;

        if ($scope.centerChangedCntr)
            centerDiff = google.maps.geometry.spherical.computeDistanceBetween(newCenter, $scope.currentCenter);

        //console.log("Center Diff: " + centerDiff + " cNTR: " + $scope.centerChangedCntr);
        if (newZoom != $scope.zoom) {
            zoomChanged = true;
            $scope.zoom = newZoom;
            console.log('New Zoom level: ' + newZoom);
        }

        if (centerDiff >= (hypotenuse / 2) || $scope.centerChangedCntr == 0 || zoomChanged) {
            console.log("Center is updated to: " + newCenter);
            $scope.centerChangedCntr++;
            $scope.currentCenter = newCenter;
            //$scope.drawCircle(newCenter, hypotenuse/2);

            /*
             Share new center and range with other controllers
             */
            SharedProps.setMapCenter(newCenter);
            SharedProps.setMaxDist(hypotenuse);
            console.log("Range: " + SharedProps.getMaxDist());

            if (!SharedProps.getProductSearched()) {
                getNearbyMarkets();
            }
            else {
                /*
                 A product is being searched right now, so scan it on new map area
                 */
                scanNearbyMarkets();
            }
        }
    };

    // Sets the map on all markers in the array.
    setMapOnAll = function (map) {
        for (var i = 0; i < $scope.marketMarkers.length; i++) {
            $scope.marketMarkers[i].setMap(map);
        }
    };

    // Removes the markers from the map, but keeps them in the array.
    clearMarkers = function () {
        setMapOnAll(null);
    };

    // Deletes all markers in the array by removing references to them.
    deleteMarkers = function () {
        clearMarkers();
        $scope.marketMarkers = [];
    };

    /*
     This callback function is invoked when current location is acquired
     */
    showPosition = function (position) {
        $scope.locationAllowed = true;
        if (position != undefined)
        {
            $scope.lat = position.coords.latitude;
            $scope.lng = position.coords.longitude;
            $scope.accuracy = position.coords.accuracy;
        }
        //$scope.$apply();

        console.log("lat: " + $scope.lat + " long: " + $scope.lng);

        var latlng = new google.maps.LatLng($scope.lat, $scope.lng);
        $scope.myMap.setCenter(latlng);
        $scope.currentCenter = latlng;      // save initial location
        $scope.zoom = $scope.myMap.getZoom();
        /*
         When zoom is changed by user, this callback will be invoked
         */
        $scope.myMap.addListener('zoom_changed', function () {
            console.log('Zoom: ' + $scope.myMap.getZoom());
        });
        //$scope.marketMarkers.push(new google.maps.Marker({ map: $scope.myMap, position: latlng }));
    };

    $scope.showAllowLocationBox = function () {
        $scope.allowLocModal = $uibModal.open({
            animation: true,
            templateUrl: 'templates/allow-gps.html',
            controller: 'allowLocationModalCtrl',
            scope: $scope,
            size: 'lg'
        });
        $scope.allowLocModal.result.then(function() {
            console.log('Success');
        }, function() {
            console.log('Cancelled');
        });
    };

    $scope.noMarketFoundBox = function () {
        $scope.noMarketFoundModal = $uibModal.open({
            animation: true,
            templateUrl: 'templates/no-market-found.html',
            controller: 'noMarketFoundModalCtrl',
            scope: $scope,
            size: 'lg'
        });
        $scope.noMarketFoundModal.result.then(function(res) {
            console.log('Success: ', res);
            if (res) {
                $scope.setMapsToDemo();
            }
        }, function() {
            console.log('Cancelled');
        });
    };

    $scope.noProductFoundBox = function () {
        $scope.noProductFoundModal = $uibModal.open({
            animation: true,
            templateUrl: 'templates/no-product-found.html',
            controller: 'noProductFoundModalCtrl',
            scope: $scope,
            size: 'lg'
        });
        $scope.noProductFoundModal.result.then(function(res) {
            console.log('Success: ', res);
        }, function() {
            console.log('Cancelled');
        });
    };

    $scope.setMapsToDemo = function() {
        $scope.centerChangedCntr = 0;
        console.log("You are being redirected to Demo location..");
        $scope.lat = "39.89396977";
        $scope.lng = "32.79992535";
        showPosition(undefined);
    };

    showError = function (error) {
        switch (error.code) {
            case error.PERMISSION_DENIED:
                $scope.error = "User denied the request for Geolocation.";
                $scope.locationAllowed = false;
                $scope.showAllowLocationBox();
                $scope.setMapsToDemo();
                break;
            case error.POSITION_UNAVAILABLE:
                $scope.error = "Location information is unavailable.";
                break;
            case error.TIMEOUT:
                $scope.error = "The request to get user location timed out.";
                break;
            default:
                $scope.error = "An unknown error occurred.";
                break;
        }
        console.log("Error: " + $scope.error);
        $scope.$apply();
    };

    $scope.getLocation = function () {
        console.log("getting current location..");
        /*
         HTML5 Geo-Location support
         */
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(showPosition, showError);
        }
        else {
            $scope.error = "Geolocation is not supported by this browser.";
            //TODO: Show a warning to User
        }
    };

    $scope.initMap = function () {
        $scope.getLocation();
    };
});

// Please note that $uibModalInstance represents a modal window (instance) dependency.
// It is not the same as the $uibModal service used above.

mainApp.controller('allowLocationModalCtrl', function ($scope) {

    /*
     Update uib Modal (Pop-up dialog)
     OK/cancel callbacks
     */
    $scope.allowLocationOK = function () {
        $scope.allowLocModal.close();
    };
});

mainApp.controller('noMarketFoundModalCtrl', function ($scope) {

    /*
     Update uib Modal (Pop-up dialog)
     OK/cancel callbacks
     */
    $scope.noMarketFoundGoToDemo = function () {
        $scope.noMarketFoundModal.close(1);
    };

    $scope.noMarketFoundClose = function () {
        $scope.noMarketFoundModal.close(0);
    };
});

mainApp.controller('noProductFoundModalCtrl', function ($scope) {

    /*
     Update uib Modal (Pop-up dialog)
     OK/cancel callbacks
     */
    $scope.noProductFoundOK = function () {
        $scope.noProductFoundModal.close();
    };
});