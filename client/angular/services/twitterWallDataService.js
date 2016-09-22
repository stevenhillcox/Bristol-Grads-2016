(function () {
    angular
        .module("TwitterWallApp")
        .factory("twitterWallDataService", twitterWallDataService);

    twitterWallDataService.$inject = ["$http"];

    function twitterWallDataService($http) {
        return {
            getTweets: getTweets,
            getMotd: getMotd,
        };

        function getTweets(since) {
            var query = {};
            if (since) {
                query.since = since;
            }
            return $http.get("/api/tweets", {params: query}).then(function(result) {
                return result.data;
            });
        }

        function getMotd() {
            return $http.get("/api/motd").then(function (result) {
                return result.data;
            });
        }
    }

})();