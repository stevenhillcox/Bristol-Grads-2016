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
        $scope.tweets = [];
        $scope.speakers = [];
        $scope.errorMessage = "";
        $scope.blockedUsers = [];

        // arrays to visualise in the 3 columns -> cut off to fit the page
        $scope.visitorsTweets = [];
        $scope.speakersTweets = [];
        $scope.pinnedTweets = [];

        // all tweets in that cathegory -> without a cut off
        $scope.allVisitorsTweets = [];
        $scope.allSpeakersTweets = [];
        $scope.allPinnedTweets = [];

        $scope.extraPinnedTweets = [];
        $scope.extraSpeakersTweets = [];

        $scope.setDeletedStatus = adminDashDataService.setDeletedStatus;
        $scope.setPinnedStatus = adminDashDataService.setPinnedStatus;
        $scope.addSpeaker = addSpeaker;
        $scope.removeSpeaker = removeSpeaker;
        $scope.switch = false;
        var hasChanged = false;

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
                pageUpdate();
                $interval(pageUpdate, 500);
            }).catch(function() {
                adminDashDataService.getAuthUri().then(function(uri) {
                    if ($routeParams.status === "unauthorised") {
                        $scope.errorMessage = "This account is not authorised, please log in with an authorised account";
                    }
                    $scope.loginUri = uri;
                });
            });
        }

        $scope.check = function(value) {
            hasChanged = true;
            $scope.switch = !value;
            console.log($scope.switch);
        };

        function pageUpdate() {
            updateTweets();
            adminDashDataService.getSpeakers().then(function(speakers) {
                $scope.speakers = speakers;
            }).catch(function(err) {
                console.log("Could not get list of speakers:" + err);
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

        function find(arr, callback, thisArg) {
            for (var idx = 0; idx < arr.length; idx++) {
                if (callback.call(thisArg, arr[idx], idx, arr)) {
                    return arr[idx];
                }
            }
        }

        function updateTweets() {
            adminDashDataService.getTweets(vm.latestUpdateTime).then(function(results) {
                if (results.updates.length > 0 || hasChanged) {
                    if (results.tweets.length > 0) {
                        results.tweets.forEach(function(tweet) {
                            $sce.trustAsHtml(tweetTextManipulationService.updateTweet(tweet));
                            if ($scope.speakers.indexOf(tweet.user.screen_name) !== -1) {
                                tweet.wallPriority = true;
                                addToSpeakers(tweet);
                            } else {
                                addToVisitors(tweet);
                            }
                        });
                    }
                    if (results.updates.length > 0) {
                        vm.latestUpdateTime = results.updates[results.updates.length - 1].since;
                    }
                    setFlagsForTweets(results.updates);
                }
            });
        }

        function setPinned(update, prop) {

            var i;
            var tweet;
            var found = false;
            if (update.status[prop] === true) {
                for (i = 0; i < $scope.allVisitorsTweets.length && found === false; i++) {
                    tweet = $scope.allVisitorsTweets[i];
                    if (tweet.id_str === update.id) {
                        tweet[prop] = update.status[prop];
                        $scope.allPinnedTweets.push(tweet);
                        $scope.allVisitorsTweets.splice(i, 1);
                        i--;
                        found = true;
                    }
                }
                for (i = 0; i < $scope.allSpeakersTweets.length && found === false; i++) {
                    tweet = $scope.allSpeakersTweets[i];
                    if (tweet.id_str === update.id) {
                        tweet[prop] = update.status[prop];
                        $scope.allPinnedTweets.push(tweet);
                        $scope.allSpeakersTweets.splice(i, 1);
                        i--;
                        found = true;
                    }
                }
            } else {
                for (i = 0; i < $scope.allPinnedTweets.length && found === false; i++) {
                    tweet = $scope.allPinnedTweets[i];
                    if (tweet.id_str === update.id) {
                        tweet[prop] = update.status[prop];
                        if (tweet.wallPriority) {
                            $scope.allSpeakersTweets.push(tweet);
                        } else {
                            $scope.allVisitorsTweets.push(tweet);
                        }
                        $scope.allPinnedTweets.splice(i, 1);
                        i--;
                        found = true;
                    }
                }
            }
        }

        function setOtherStatus(update, prop) {
            var i;
            var tweet;
            var found = false;
            for (i = 0; i < $scope.allVisitorsTweets.length && found === false; i++) {
                tweet = $scope.allVisitorsTweets[i];
                if (tweet.id_str === update.id) {
                    tweet[prop] = update.status[prop];
                    found = true;
                }
            }
            for (i = 0; i < $scope.allSpeakersTweets.length && found === false; i++) {
                tweet = $scope.allSpeakersTweets[i];
                if (tweet.id_str === update.id) {
                    tweet[prop] = update.status[prop];
                    found = true;
                }
            }
            for (i = 0; i < $scope.allPinnedTweets.length && found === false; i++) {
                tweet = $scope.allPinnedTweets[i];
                if (tweet.id_str === update.id) {
                    tweet[prop] = update.status[prop];
                    found = true;
                }
            }
        }

        function setStatus(update) {

            for (var prop in update.status) {
                if (prop === "pinned") {
                    setPinned(update, prop);
                } else {
                    setOtherStatus(update, prop);
                }
            }
        }

        function updateSpeaker(update, value) {
            var tweet;
            var i;
            if (value) {
                for (i = 0; i < $scope.allVisitorsTweets.length; i++) {
                    tweet = $scope.allVisitorsTweets[i];
                    if (tweet.user.screen_name === update.screen_name) {
                        tweet.wallPriority = value;
                        addToSpeakers(tweet);
                        $scope.allVisitorsTweets.splice(i, 1);
                        i--;
                    }
                }
                for (i = 0; i < $scope.allPinnedTweets.length; i++) {
                    tweet = $scope.allPinnedTweets[i];
                    if (tweet.user.screen_name === update.screen_name) {
                        tweet.wallPriority = value;
                        addToSpeakers(tweet);
                        $scope.allPinnedTweets.splice(i, 1);
                        i--;
                    }
                }
            } else {
                for (i = 0; i < $scope.allSpeakersTweets.length; i++) {
                    tweet = $scope.allSpeakersTweets[i];
                    if (tweet.user.screen_name === update.screen_name) {
                        tweet.wallPriority = value;
                        if (tweet.pinned) {
                            addToPinned(tweet);
                        } else {
                            addToVisitors(tweet);
                        }
                        $scope.allSpeakersTweets.splice(i, 1);
                        i--;
                    }
                }
            }
        }

        function blockUser(update) {
            $scope.allVisitorsTweets.forEach(function(tweet) {
                if (tweet.user.screen_name === update.screen_name) {
                    tweet.blocked = update.blocked;
                }
            });
            $scope.allPinnedTweets.forEach(function(tweet) {
                if (tweet.user.screen_name === update.screen_name) {
                    tweet.blocked = update.blocked;
                }
            });
            $scope.allSpeakersTweets.forEach(function(tweet) {
                if (tweet.user.screen_name === update.screen_name) {
                    tweet.blocked = update.blocked;
                }
            });
        }

        function addToSpeakers(tweet) {
            $scope.allSpeakersTweets.push(tweet);
        }

        function addToVisitors(tweet) {
            $scope.allVisitorsTweets.push(tweet);
        }

        function addToPinned(tweet) {
            $scope.allPinnedTweets.push(tweet);
        }

        function splitTweetsIntoCategories() {
            var tweetCount;
            var result;
            var countVisitors = 0;
            var countSpeakers = 0;
            var countPinned = 0;

            $scope.visitorsTweets = [];
            $scope.speakersTweets = [];
            $scope.pinnedTweets = [];

            $scope.extraPinnedTweets = [];
            $scope.extraSpeakersTweets = [];

            result = cutOffArray($scope.allSpeakersTweets, 6);
            $scope.speakersTweets = result.tweets;
            countSpeakers = result.count;

            result = cutOffArray($scope.allPinnedTweets, 5);
            $scope.pinnedTweets = result.tweets;
            countPinned = result.count;

            $scope.allVisitorsTweets = $scope.allVisitorsTweets.sort(compare);
            $scope.allVisitorsTweets.forEach(function(tweet) {
                tweetCount = tweet.entities.media !== undefined ? 2 : 1;
                if (!(tweet.deleted || tweet.blocked) || tweet.display || $scope.switch) {
                    if (tweetCount + countVisitors < 6) {
                        $scope.visitorsTweets.push(tweet);
                        countVisitors += tweetCount;
                    } else if (tweetCount + countPinned < 5) {
                        $scope.extraPinnedTweets.push(tweet);
                        countPinned += tweetCount;
                    } else if (tweetCount + countSpeakers < 6) {
                        $scope.extraSpeakersTweets.push(tweet);
                        countSpeakers += tweetCount;
                    }
                }
            });
        }

        function cutOffArray(array, maxCount) {
            var tweetCount;
            var count = 0;
            var newArray = [];
            array = array.sort(compare);
            array.forEach(function(tweet) {
                tweetCount = tweet.entities.media !== undefined ? 2 : 1;
                if (tweetCount + count < maxCount) {
                    if (!(tweet.deleted || tweet.blocked) || tweet.display || $scope.switch) {
                        newArray.push(tweet);
                        count += tweetCount;
                    }
                } else {
                    return newArray;
                }
            });
            return {
                tweets: newArray,
                count: count
            };
        }

        function compare(a, b) {
            if (new Date(a.created_at) > new Date(b.created_at)) {
                return -1;
            }
            if (new Date(a.created_at) < new Date(b.created_at)) {
                return 1;
            }
            return 0;
        }

        function setFlagsForTweets(updates) {
            updates.forEach(function(update) {
                if (update.type === "tweet_status") {
                    setStatus(update);
                } else if (update.type === "user_block") {
                    blockUser(update);
                } else if (update.type === "speaker_update") {
                    if (update.operation === "add") {
                        updateSpeaker(update, true);
                    } else if (update.operation === "remove") {
                        updateSpeaker(update, false);
                    }
                }
            });
            splitTweetsIntoCategories();
        }
    }

})();
