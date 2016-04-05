/**
 * Created by kadir on 17.12.2015.
 */
// public/core.js
mainApp.controller('loginCtrl', function($scope, $rootScope, $http, $window, $uibModal, $timeout, SharedProps, envService) {
    $scope.mds = envService.read('apiUrl'); // SharedProps.getServerURL();
    $scope.showLoginError = false;

    $scope.isSubmitting = false;

    // Required - set to 'success' or 'error' on success/failure
    $scope.result = null;

    // Optional
    $scope.options = {
        buttonDefaultText: 'Login',
        iconsPosition: 'right',
        buttonErrorText: 'Bilgiler hatalı !',
        buttonSubmittingText: 'Giriş yapılıyor..',
        buttonSuccessText: 'Başarılı !'
    };

    console.log("loginCtrl running..");

    $scope.logMeIn = function () {
        $scope.isSubmitting = true;
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
                    $timeout(function() {
                        console.log("Login successful.");
                        $scope.result = 'success';
                        // TODO: If admin redirect to admin page
                        if (data.redirect != undefined) {
                            console.log("redirecting to " + data.redirect);
                            $window.location.href = data.redirect;
                        }
                    }, 2000);
                } else {
                    console.log("Login NOT successful.");
                    $scope.showLoginError = true;
                    $scope.result = "error";
                    $scope.isSubmitting = false;
                }
            })
            .error(function(data) {
                console.log('Error: ' + data);
                $scope.result = "error";
                $scope.isSubmitting = null;
            })
            .then(function(response) {
                return response.data;
            });
    };
});

