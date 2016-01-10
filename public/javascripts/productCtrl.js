/**
 * Created by kadir on 21.12.2015.
 */
/**
 * Created by kadir on 17.12.2015.
 */
// public/core.js

mainApp.controller('productCtrl', function($scope, $rootScope, $http, SharedProps) {
    $scope.searchText = "";
    $scope.mds = SharedProps.getServerURL();

    console.log("products ctrl..");

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

    $scope.queryProducts = function(searchText) {
        console.log("REQ: /mds/api/products?api_key=test&search=" + searchText);
        console.log("VAL: " + searchText);

        return $http.get($scope.mds + '/mds/api/products?api_key=test&search=' + searchText)
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

    $scope.scanNearbyMarketsbyProductBarcode = function(barcode) {
        console.log("HTTP POST request to scan nearby markets by barcode: " + barcode);
        var url = "mds/api/scannearby/?";

        var mapCenter = SharedProps.getMapCenter();
        console.log("Lat: " + mapCenter.lat() + " Long: " + mapCenter.lng());
        console.log("Range: " + SharedProps.getMaxDist());

        url += "lat=" + mapCenter.lat() + "&long=" + mapCenter.lng();
        url += "&barcode=" + barcode;
        url += "&max_dist=" + SharedProps.getMaxDist() + "&api_key=test";

        console.log("Req. URL: " + url);

        $rootScope.$emit('scanNearby', url);// res - your data

        /*return $http.get(url)
            .success(function(data) {
                //$scope.ma = data.product;
                console.log(data);
            })
            .error(function(data) {
                console.log('Error: ' + data);
            })
            .then(function(response) {
                console.log("THEN: " + response.data.markets);
                NProgress.done();
                return response.data.markets;
            });*/
    };

    $scope.scanNearbyMarketsbyProductName = function(productQueryName) {
        console.log("HTTP POST request to scan nearby markets by name: " + productQueryName);
    };

    $scope.onProductSelect = function(item, model, label) {
        //console.log("item : " + JSON.stringify(item));
        NProgress.inc(0.5);
        console.log("model: " + JSON.stringify(model));
        //console.log("label: " + label);
        $scope.scanNearbyMarketsbyProductBarcode(model.barcode);
    };

    $scope.searchProduct = function() {
        if ($scope.searchText.length < 2) {
            console.log("search text: " + $scope.searchText + " limit: 2");
        } else {
            NProgress.inc(0.5);
            $scope.scanNearbyMarketsbyProductName($scope.searchText);
        }
    }
});

