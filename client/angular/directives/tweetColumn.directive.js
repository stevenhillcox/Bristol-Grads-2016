(function() {
    angular.module("TwitterWallApp").directive("tweetColumn", tweetColumn);

    function tweetColumn() {
        return {
            restrict: "E",
            scope: {
                tweets: "=",
                visitorsTweets: "=",
                speakersTweets: "=",
                pinnedTweets: "=",
                extraPinnedTweets: "=",
                extraSpeakersTweets: "=",
                admin: "=",
                switch: "=",
                position: "@",
                hasImage: "&",
                setDeletedStatus: "&",
                addBlockedUser: "&",
                setPinnedStatus: "&",
                displayBlockedTweet: "&",
            },
            templateUrl: function(element, attrs) {
                var admin = "templates/tweet-column-" + attrs.position + "-admin.html";
                var client = "templates/tweet-column-" + attrs.position + ".html";
                return client;
            },
            link: function(scope, element, attrs) {
                scope.getSize = function(text) {
                    var size;
                    var charCount = text.toString().split("").length;
                    console.log(charCount);
                    if (charCount < 85) {
                        size = "x-large";
                    } else if (charCount < 120) {
                        size = "large";
                    } else {
                        size = "medium";
                    }
                    console.log(size);
                    return {
                        "font-size": size
                    };
                };
                scope.getTweets = function() {
                    return (scope.admin ? scope.tweets : scope.tweets.filter(function(tweet) {
                        return (!(tweet.deleted || tweet.blocked) || tweet.display);
                    })).filter(function(tweet) {
                        return getTweetColumn(tweet) === scope.position;
                    });
                };
                scope.tweetDate = tweetDate;

                function tweetDate(tweet) {
                    return new Date(tweet.created_at);
                }

                function getTweetColumn(tweet) {
                    if (tweet.pinned) {
                        return "left";
                    } else if (tweet.wallPriority) {
                        return "right";
                    } else {
                        return "middle";
                    }
                }
            },
        };
    }
})();
