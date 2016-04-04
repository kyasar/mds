/**
 * Created by kadir on 17.12.2015.
 */
// public/core.js
mainApp.controller('loginCtrl', function($scope, $rootScope, $http, $window, $uibModal, SharedProps, envService) {
    $scope.mds = envService.read('apiUrl'); // SharedProps.getServerURL();
    $scope.showLoginError = false;

    console.log("loginCtrl running..");

    $scope.logMeIn = function () {
        $scope.showLoginError = false;

        console.log("REQ: " + $scope.mds + "/login");
        console.log("Logging with email: ", $scope.email, " password: ", $scope.password);

        return $http({
                url: $scope.mds + '/login',
                dataType: "json",
                method: "POST",
                data: {
                    email: $scope.email,
                    password: $scope.password
                    },
                headers: {'Content-Type': 'application/json'}
            })
            .success(function(data) {
                console.log("data.status: ", data.status);
                if (data.status == "OK") {
                    console.log("Login successful.");
                    // TODO: If admin redirect to admin page
                    if (data.redirect != undefined) {
                        console.log("redirecting to " + data.redirect);
                        $window.location.href = data.redirect;
                    }
                } else {
                    console.log("Login NOT successful.");
                    $scope.showLoginError = true;
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

