(function() {

    angular.module("TwitterWallApp").controller("AdminController", AdminController);

    AdminController.$inject = [
        "$scope",
        "adminDashDataService",
        "$sce",
        "tweetTextManipulationService",
        "$routeParams",
        "$interval",
    ];

    function AdminController(
        $scope, adminDashDataService, $sce, tweetTextManipulationService, $routeParams, $interval
    ) {
        var vm = this;
        $scope.loggedIn = false;
        $scope.ctrl = {};
        $scope.errorMessage = "";
        $scope.blockedUsers = [];

        $scope.setDeletedStatus = adminDashDataService.setDeletedStatus;
        $scope.setPinnedStatus = adminDashDataService.setPinnedStatus;
        $scope.addSpeaker = addSpeaker;
        $scope.removeSpeaker = removeSpeaker;

        $scope.displayBlockedTweet = adminDashDataService.displayBlockedTweet;

        $scope.getBlockedUsers = function() {
            adminDashDataService.blockedUsers().then(function(users) {
                $scope.blockedUsers = users;
            });
        };

        $scope.removeBlockedUser = function(user) {
            adminDashDataService.removeBlockedUser(user).then(function(result) {
                adminDashDataService.blockedUsers().then(function(users) {
                    $scope.blockedUsers = users;
                });
            });
        };

        $scope.addBlockedUser = function(name, screen_name) {
            adminDashDataService.addBlockedUser(name, screen_name).then(function(result) {
                adminDashDataService.blockedUsers().then(function(users) {
                    $scope.blockedUsers = users;
                });
            });
        };

        $scope.logOut = function() {
            adminDashDataService.logOut().then(function() {
                adminDashDataService.getAuthUri().then(function(uri) {
                    $scope.loginUri = uri;
                    $scope.loggedIn = false;
                });
            });
        };

        activate();

        function activate() {
            adminDashDataService.authenticate().then(function() {
                $scope.loggedIn = true;
            }).catch(function() {
                adminDashDataService.getAuthUri().then(function(uri) {
                    if ($routeParams.status === "unauthorised") {
                        $scope.errorMessage = "This account is not authorised, please log in with an authorised account";
                    }
                    $scope.loginUri = uri;
                });
            });
        }

        function addSpeaker() {
            adminDashDataService.addSpeaker($scope.ctrl.speaker).then(function(result) {
                $scope.ctrl.speaker = "";
                return adminDashDataService.getSpeakers();
            }).then(function(speakers) {
                $scope.speakers = speakers;
            });
        }

        function removeSpeaker(speaker) {
            adminDashDataService.removeSpeaker(speaker).then(function(result) {
                return adminDashDataService.getSpeakers();
            }).then(function(speakers) {
                $scope.speakers = speakers;
            });
        }
    }

})();
