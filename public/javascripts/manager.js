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
    $scope.currentPage = 1;
    $scope.currentUserPage = 1;
    $scope.currentMarketPage = 1;
    $scope.itemsPerPage = 10;
    $scope.mds = envService.read('apiUrl'); // SharedProps.getServerURL();

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
                    $scope.products = data.products.docs;
                    $scope.itemsPerPage = data.products.limit;
                    $scope.totalProducts = data.products.total;
                } else {
                    console.log("Cannot retrieve products");
                }
            })
            .error(function(data) {
                console.log('Error: ' + data);
            })
            .then(function(response) {
                return response.data.products;
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
                product: function () {
                    return product;
                }
            }
        });

        $scope.updateProductModal.result.then(function (productUpdated) {
            //console.log('Update goes to server: ', JSON.stringify(productUpdated));
            return $http({
                    url: $scope.mds + '/mds/api/products/' + product.barcode + '?api_key=test',
                    dataType: "json",
                    method: "PUT",
                    data: {name: productUpdated.name, barcode: productUpdated.barcode},
                    headers: {'Content-Type': 'application/json'}
                }
            ).success(function (data) {
                    console.log("data.status: ", data.status);
                    if (data.status == "OK") {
                        console.log("Product updated successfully.");
                        $scope.pageChanged();
                    } else {
                        console.log("Unable to update product: " + productUpdated.barcode + "\nReason: " + data.error);
                    }
                })
                .error(function (data) {
                    console.log('Error: ' + data);
                })
                .then(function (response) {
                    return response.data;
                });
        }, function () {
            console.log('Update Cancelled');
        });
    };


    //////////////////////////////////////////////////
    ///     USERS
    //////////////////////////////////////////////////

    $scope.retrieveAllUsers = function(page, limit) {
        var queryURL = $scope.mds + '/mds/api/users/all?api_key=test'
        + '&page=' + page + '&limit=' + limit;

        console.log("Retrieve all users query: " + queryURL);
        return $http.get(queryURL)
            .success(function(data) {
                console.log(data);
                if (data.status == "OK") {
                    $scope.users = data.users.docs;
                    $scope.itemsPerPage = data.users.limit;
                    $scope.totalUsers = data.users.total;
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

    $scope.userPageChanged = function() {
        console.log('User Page changed to: ' + $scope.currentUserPage);
        $scope.retrieveAllUsers($scope.currentUserPage, $scope.itemsPerPage);
    };

    $scope.updateUser = function(user) {
        console.log("User: ", user.email, " will be updated.");

        $scope.updateUserModal = $uibModal.open({
            animation: true,
            templateUrl: 'templates/update-user.html',
            controller: 'updateUserModalCtrl',
            scope: $scope,
            size: 'lg',
            resolve: {
                user: function() {
                    return user;
                }
            }
        });

        $scope.updateUserModal.result.then(function(userUpdated) {
            console.log('Update goes to server: ', JSON.stringify(userUpdated));
            return $http({
                    url: $scope.mds + '/mds/api/users/' + user.email + '?api_key=test',
                    dataType: "json",
                    method: "PUT",
                    data: {
                        firstName: userUpdated.firstName,
                        lastName: userUpdated.lastName,
                        email: userUpdated.email,
                        password: userUpdated.password,
                        verification: userUpdated.verification,
                        role: userUpdated.role,
                        points: userUpdated.points
                    },
                    headers: {'Content-Type': 'application/json'}}
            ).success(function(data) {
                    console.log("data.status: ", data.status);
                    if (data.status == "OK") {
                        console.log("User updated successfully.");
                        $scope.userPageChanged();
                    } else {
                        console.log("Unable to update user: " + userUpdated.email + "\nReason: " + data.error);
                    }
                })
                .error(function(data) {
                    console.log('Error: ' + data);
                })
                .then(function(response) {
                    return response.data;
                });
        }, function() {
            console.log('User update Cancelled');
        });
    };

    $scope.removeUser = function(user) {
        console.log("User: ", user.email, " will be removed.");

        return $http.delete($scope.mds + '/mds/api/users/' + user.email + '?api_key=test')
            .success(function(data) {
                console.log("data.status: ", data.status);
                if (data.status == "OK") {
                    var index = $scope.users.indexOf(user);
                    if (index !== -1) {
                        $scope.users.splice(index, 1);    // Removed just in client-side
                    }
                    console.log("User removed successfully.");
                } else {
                    console.log("Unable to remove user: " + user.email + "\nReason: " + data.error);
                }
            })
            .error(function(data) {
                console.log('Error: ' + data);
            })
            .then(function(response) {
                return response.data;
            });
    };


    //////////////////////////////////////////////////
    ///     MARKETS
    //////////////////////////////////////////////////

    $scope.retrieveAllMarkets = function(page, limit) {
        var queryURL = $scope.mds + '/mds/api/markets/all?api_key=test'
            + '&page=' + page + '&limit=' + limit;

        console.log("Retrieve all markets query: " + queryURL);
        return $http.get(queryURL)
            .success(function(data) {
                console.log(data);
                if (data.status == "OK") {
                    $scope.markets = data.markets.docs;
                    $scope.itemsPerPage = data.markets.limit;
                    $scope.totalMarkets = data.markets.total;
                } else {
                    console.log("Cannot retrieve markets");
                }
            })
            .error(function(data) {
                console.log('Error: ' + data);
            })
            .then(function(response) {
                return response.data.markets;
            });
    };

    $scope.marketPageChanged = function() {
        console.log('Market Page changed to: ' + $scope.currentMarketPage);
        $scope.retrieveAllMarkets($scope.currentMarketPage, $scope.itemsPerPage);
    };

    $scope.updateMarket = function(user) {
        console.log("User: ", user.email, " will be updated.");

        $scope.updateUserModal = $uibModal.open({
            animation: true,
            templateUrl: 'templates/update-user.html',
            controller: 'updateUserModalCtrl',
            scope: $scope,
            size: 'lg',
            resolve: {
                user: function() {
                    return user;
                }
            }
        });

        $scope.updateUserModal.result.then(function(userUpdated) {
            console.log('Update goes to server: ', JSON.stringify(userUpdated));
            return $http({
                    url: $scope.mds + '/mds/api/users/' + user.email + '?api_key=test',
                    dataType: "json",
                    method: "PUT",
                    data: {
                        firstName: userUpdated.firstName,
                        lastName: userUpdated.lastName,
                        email: userUpdated.email,
                        password: userUpdated.password,
                        verification: userUpdated.verification,
                        role: userUpdated.role,
                        points: userUpdated.points
                    },
                    headers: {'Content-Type': 'application/json'}}
            ).success(function(data) {
                    console.log("data.status: ", data.status);
                    if (data.status == "OK") {
                        console.log("User updated successfully.");
                        $scope.userPageChanged();
                    } else {
                        console.log("Unable to update user: " + userUpdated.email + "\nReason: " + data.error);
                    }
                })
                .error(function(data) {
                    console.log('Error: ' + data);
                })
                .then(function(response) {
                    return response.data;
                });
        }, function() {
            console.log('User update Cancelled');
        });
    };

    $scope.removeMarket = function(market) {
        console.log("Market: ", market.email, " will be removed.");

        return $http.delete($scope.mds + '/mds/api/markets/' + market._id + '?api_key=test')
            .success(function(data) {
                console.log("data.status: ", data.status);
                if (data.status == "OK") {
                    var index = $scope.markets.indexOf(market);
                    if (index !== -1) {
                        $scope.markets.splice(index, 1);    // Removed just in client-side
                    }
                    console.log("Market removed successfully.");
                } else {
                    console.log("Unable to remove market: " + market.name + "\nReason: " + data.error);
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

managerApp.controller('updateUserModalCtrl', function ($scope, $uibModalInstance, user) {

    $scope.userToUpdate = {};
    angular.copy(user, $scope.userToUpdate);
    //console.log(JSON.stringify(product), " ", JSON.stringify($scope.productToUpdate));
    /*
     Update uib Modal (Pop-up dialog)
     OK/cancel callbacks
     */
    $scope.updateUserOK = function () {
        $scope.updateUserModal.close($scope.userToUpdate);
    };

    $scope.updateUserCancel = function () {
        $scope.updateUserModal.dismiss('cancel');
    };
});
