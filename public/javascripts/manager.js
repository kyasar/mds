/**
 * Created by kadir on 17.12.2015.
 */
// public/core.js
var managerApp = angular.module('managerApp', ['ui.bootstrap', 'ui.map', 'ui.event', 'environment', 'smart-table']);

managerApp.run(function ($rootScope) {
    console.log("ManagerApp run");
});

managerApp.config(function(envServiceProvider) {
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

managerApp.factory('SharedProps', function ($rootScope, envService) {
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

managerApp.controller('managerCtrl', function($scope, $rootScope, $http, $uibModal, SharedProps, envService) {
    $scope.searchText = "";
    $scope.currentPage = 1;
    $scope.itemsPerPage = 10;
    $scope.mds = envService.read('apiUrl'); // SharedProps.getServerURL();

    console.log("manager ctrl..");

    $scope.retrieveAllCategories = function() {
        val = queryURL = $scope.mds + '/mds/api/category';
        console.log("Retrieve all categories query: " + queryURL);
        return $http.get(queryURL)
            .success(function(data) {
                console.log(data);
                if (data.status == "OK") {
                    $scope.categories = data.categories;
                } else {
                    console.log("Cannot retrieve categories");
                }
            })
            .error(function(data) {
                console.log('Error: ' + data);
            })
            .then(function(response) {
                return response.data.categories;
            });
    };

    $scope.retrieveAllUsers = function() {
        val = queryURL = $scope.mds + '/mds/api/users';
        console.log("Retrieve all users query: " + queryURL);
        return $http.get(queryURL)
            .success(function(data) {
                console.log(data);
                if (data.status == "OK") {
                    $scope.users = data.users;
                } else {
                    console.log("Cannot retrieve users");
                }
            })
            .error(function(data) {
                console.log('Error: ' + data);
            })
            .then(function(response) {
                return response.data.users;
            });
    };

    $scope.retrieveAllProducts = function(page, limit, name, barcode) {
        val = queryURL = $scope.mds + '/mds/api/products/all?api_key=test'
        + '&page=' + page + '&limit=' + limit;
        //console.log("name: ", name, "barcode: ", barcode);
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
                        $scope.pageChanged();
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

managerApp.controller('updateProductModalCtrl', function ($scope, $uibModalInstance, product) {

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
