/**
 * Created by kadir on 17.12.2015.
 */

mainApp.controller('productCtrl', function($scope, $rootScope, $http, SharedProps, envService) {
    $scope.searchText = "";
    $scope.currentPage = 1;
    $scope.itemsPerPage = 10;
    $scope.mds = envService.read('apiUrl'); // SharedProps.getServerURL();

    console.log("products ctrl..");

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
                //console.log("THEN: " + response.data.product);
                return response.data.product;
            });
    };

    $scope.scanNearbyMarketsbyProductBarcode = function(barcode) {
        console.log("HTTP POST request to scan nearby markets by barcode: " + barcode);
        $rootScope.$emit('scanNearby');// res - your data
    };

    $scope.scanNearbyMarketsbyProductName = function(productQueryName) {
        console.log("HTTP POST request to scan nearby markets by name: " + productQueryName);
    };

    $scope.onProductSelect = function(item, model, label) {
        //console.log("item : " + JSON.stringify(item));
        NProgress.inc(0.5);
        //slider.slideReveal("hide");
        console.log("model: " + JSON.stringify(model));
        // Product is searched
        SharedProps.setProductSearched(true);
        SharedProps.setProductBarcode(model.barcode);
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
    };

    $scope.retrieveAllProducts = function(page, limit) {
        //console.log($scope.mds + '/mds/api/products/all?api_key=test' + '&page=' + page + '&limit=' + limit);
        return $http.get($scope.mds + '/mds/api/products/all?api_key=test' + '&page=' + page + '&limit=' + limit)
            .success(function(data) {
                console.log(data);
                if (data.status == "OK") {
                    $scope.products = data.product.docs;
                    $scope.itemsPerPage = data.product.limit;
                    $scope.totalProducts = data.product.total;
                } else {
                    console.log("Cannot retrieve products");
                }
            })
            .error(function(data) {
                console.log('Error: ' + data);
            })
            .then(function(response) {
                return response.data.product;
            });
    };

    $scope.pageChanged = function() {
        console.log('Page changed to: ' + $scope.currentPage);
        $scope.retrieveAllProducts($scope.currentPage, $scope.itemsPerPage);
    };

    $scope.removeProduct = function(product) {
        console.log("Product: ", product.name, " ", product.barcode, " will be removed.");

        return $http.delete($scope.mds + '/mds/api/products/' + product.barcode + '?api_key=test')
            .success(function(data) {
                console.log("data.status: ", data.status);
                if (data.status == "OK") {
                    var index = $scope.products.indexOf(product);
                    if (index !== -1) {
                        $scope.products.splice(index, 1);    // Removed just in client-side
                    }
                    console.log("Product removed successfully.");
                } else {
                    console.log("Unable to delete product: " + product.barcode + "\nReason: " + data.error);
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

