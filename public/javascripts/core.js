/**
 * Created by kadir on 17.12.2015.
 */
// public/core.js
var markodApp = angular.module('markodMP', ["ui.bootstrap"]);

markodApp.controller('productSearchCtrl', function($scope, $http) {
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

    // when submitting the add form, send the text to the node API
    $scope.createTodo = function() {
        $http.post('/api/todos', $scope.formData)
            .success(function(data) {
                $scope.formData = {}; // clear the form so our user is ready to enter another
                $scope.todos = data;
                console.log(data);
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
    };

    // delete a todo after checking it
    $scope.deleteTodo = function(id) {
        $http.delete('/api/todos/' + id)
            .success(function(data) {
                $scope.todos = data;
                console.log(data);
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
    };

});