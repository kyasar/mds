/**
 * Created by kadir on 21.12.2015.
 */
/**
 * Created by kadir on 17.12.2015.
 */
// public/core.js
var productCtrl = angular.module('productCtrl', []);

productCtrl.controller('productCtrl', function($scope, $http) {
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
    //$scope.formData = {};
    // Set initial coordinates to the center of the US
    //$scope.formData.longitude = -98.350;
    //$scope.formData.latitude = 39.500;

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

