/**
 * Created by kadir on 17.12.2015.
 */

mainApp.controller('productCtrl', function($scope, $rootScope, $http, $uibModal, SharedProps, envService) {
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

    $scope.retrieveAllProducts = function(page, limit, name, barcode) {
        val = queryURL = $scope.mds + '/mds/api/products/all?api_key=test'
            + '&page=' + page + '&limit=' + limit;
        console.log("name: ", name, "barcode: ", barcode);
        if (name != undefined && name != "")
        {
            queryURL += "&name=" + name;
        }
        if (barcode != undefined && barcode != "")
        {
            queryURL += "&barcode=" + barcode;
        }
        console.log("Retrieve all query: " + queryURL);
        return $http.get(queryURL)
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

    $scope.retrieveAllByName = function(name) {
        $scope.currentPage = 1;
        console.log('Query by product name: ' + name);
        $scope.retrieveAllProducts($scope.currentPage, $scope.itemsPerPage, name);
    };

    $scope.retrieveAllByBarcode = function(barcode) {
        $scope.currentPage = 1;
        console.log('Query by product barcode: ' + barcode);
        $scope.retrieveAllProducts($scope.currentPage, $scope.itemsPerPage, undefined, barcode);
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

    $scope.updateProduct = function(product) {
        console.log("Product: ", product.name, " ", product.barcode, " will be updated.");

        $scope.updateProductModal = $uibModal.open({
            animation: true,
            templateUrl: 'templates/update-product.html',
            controller: 'updateProductModalCtrl',
            scope: $scope,
            size: 'lg',
            resolve: {
                product: function() {
                    return product;
                }
            }
        });

        $scope.updateProductModal.result.then(function(productUpdated) {
            //console.log('Update goes to server: ', JSON.stringify(productUpdated));
            return $http({
                url: $scope.mds + '/mds/api/products/' + product.barcode + '?api_key=test',
                dataType: "json",
                method: "PUT",
                data: {name: productUpdated.name, barcode: productUpdated.barcode},
                headers: {'Content-Type': 'application/json'}}
                ).success(function(data) {
                    console.log("data.status: ", data.status);
                    if (data.status == "OK") {
                        console.log("Product updated successfully.");
                    } else {
                        console.log("Unable to update product: " + productUpdated.barcode + "\nReason: " + data.error);
                    }
                })
                .error(function(data) {
                    console.log('Error: ' + data);
                })
                .then(function(response) {
                    return response.data;
                });
        }, function() {
            console.log('Update Cancelled');
        });
    };
});

// Please note that $uibModalInstance represents a modal window (instance) dependency.
// It is not the same as the $uibModal service used above.

mainApp.controller('updateProductModalCtrl', function ($scope, $uibModalInstance, product) {

    $scope.productToUpdate = {};
    angular.copy(product, $scope.productToUpdate);
    //console.log(JSON.stringify(product), " ", JSON.stringify($scope.productToUpdate));
    /*
     Update uib Modal (Pop-up dialog)
     OK/cancel callbacks
     */
    $scope.updateProductOK = function () {
        $scope.updateProductModal.close($scope.productToUpdate);
    };

    $scope.updateProductCancel = function () {
        $scope.updateProductModal.dismiss('cancel');
    };
});

