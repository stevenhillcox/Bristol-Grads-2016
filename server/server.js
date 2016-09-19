var express = require("express");
var Twitter = require("twitter");
var cookieParser = require("cookie-parser");


module.exports = function(port, googleAuthoriser) {
    var app = express();

    var adminToken;

    app.use(express.static("client"));
    app.use(cookieParser());

    app.get("/oauth", function(req, res) {
        googleAuthoriser.authorise(req, function(err, token) {
            if (!err) {
                console.log("success");
                adminToken = token;
                res.cookie("sessionToken", token);
                res.header("Location", "/dash.html");
                res.sendStatus(302);
            }
            else {
                console.log(err);
                res.sendStatus(400);
            }
        });
    });

    app.get("/api/oauth/uri", function(req, res) {
        res.json({
            uri: googleAuthoriser.oAuthUri
        });
    });

    app.use("/admin", function(req, res, next) {
        if (req.cookies.sessionToken) {
            if (req.cookies.sessionToken === adminToken) {
                next();
            } else {
                res.sendStatus(401);
            }
        } else {
            res.sendStatus(401);
        }
    });

    app.get("/admin", function(req, res) {
        res.sendStatus(200);
    });

    var client = new Twitter({
        consumer_key: process.env.TWITTER_CONSUMER_KEY,
        consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
        access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
        access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
    });

    var tweetStore = [];
    var hashtags = ["#bristech", "#bristech2016"];
    var sinceIdH = [0, 0];
    var sinceId;

    app.get("/api/test", function(req, res) {
        client.get("statuses/user_timeline", {screen_name: "bristech"}, function(error, tweets, response) {
            if (tweets) {
                res.json(tweets);
            } else {
                res.sendStatus(500);
            }
        });
    });


    app.get("/api/tweets", function(req, res) {
        res.json(getTweets());
    });


    function getTweetsWithHashtag() {
        hashtags.forEach(function (hashtag) {
            var query = {
                q: hashtag,
                since_id: sinceIdH[hashtags.indexOf(hashtag)]
            }
            client.get("search/tweets", query, function(error, tweets, response) {
                if (tweets) {
                    console.log(tweets.statuses);
                    tweets.statuses.forEach(function(tweet) {
                        sinceIdH[hashtags.indexOf(hashtag)] = tweet.id;
                        tweetStore.push(tweet);
                    });
                } else {
                    console.log(error);
                }
            });
        });
        
    }

    function getTweets() {
        return tweetStore;
    }


    function getTweetsFrom(screenName) {
        var query = {screen_name: screenName};
        if (sinceId) {
            query.sinceId = sinceId;
        }
        client.get("statuses/user_timeline", query, function(error, tweets, response) {
            if (tweets) {
                tweets.forEach(function(tweet) {
                    sinceId = tweet.id;
                    tweetStore.push(tweet);
                });
            } else {
                console.log(error);
            }
        });
    }

    getTweetsFrom("bristech");
    var refresh = setInterval(function () {
        getTweetsFrom("bristech");
        getTweetsWithHashtag();
    } , 30000); //super conservative for now

    return app.listen(port);
};

