module.exports = function(grunt) {
    grunt.loadNpmTasks("grunt-concurrent");
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-jscs");
    grunt.loadNpmTasks("grunt-jasmine-nodejs");
    grunt.loadNpmTasks("grunt-contrib-jasmine");
    grunt.loadNpmTasks("grunt-jsbeautifier");
    grunt.loadNpmTasks("grunt-webpack");
    grunt.loadNpmTasks("grunt-sass");

    var webpack = require("webpack");
    var child_process = require("child_process");

    var files = [
        "Gruntfile.js",
        "server.js",
        "server/**/*.js",
        "spec/**/*.js",
        "client/**/*.js",
        "!client/bundle/**/*.js"
    ];

    var serveProc = null;

    grunt.initConfig({
        jshint: {
            all: files,
            options: {
                jshintrc: true,
                ignores: [
                    "./client/bundle/bundle.js"
                ]
            }
        },
        jscs: {
            fix: {
                files: {
                    src: files
                },
                options: {
                    config: ".jscsrc",
                    fix: true,
                    excludeFiles: [
                        "./client/bundle/bundle.js"
                    ]
                }
            },
            verify: {
                files: {
                    src: files
                },
                options: {
                    config: ".jscsrc",
                    fix: false,
                    excludeFiles: [
                        "./client/bundle/bundle.js"
                    ]
                }
            },
        },
        jasmine_nodejs: {
            options: {
                specNameSuffix: "spec.js",
            },
            server: {
                specs: [
                    "spec/server/*.spec.js"
                ]
            }
        },
        jasmine: {
            default: {
                src: [
                    "node_modules/phantomjs-polyfill-find-index/findIndex-polyfill.js",
                    "client/*.html",
                    "client/templates/*.html",
                    "client/angular/**/*.js",
                ],
                options: {
                    specs: "spec/client/**/*.spec.js",
                    vendor: [
                        "http://ajax.googleapis.com/ajax/libs/angularjs/1.5.5/angular.min.js",
                        "http://ajax.googleapis.com/ajax/libs/angularjs/1.5.5/angular-mocks.js",
                        "http://ajax.googleapis.com/ajax/libs/angularjs/1.4.3/angular-route.js",
                    ]
                }
            }
        },
        webpack: {
            production: {
                entry: "./client/main.js",
                output: {
                    path: "client/bundle",
                    filename: "bundle.js"
                },
                module: {
                    loaders: [{
                        test: /\.css$/,
                        loader: "style-loader!css-loader"
                    }]
                },
                plugins: [
                    new webpack.optimize.UglifyJsPlugin({
                        minimize: true
                    })
                ]
            },
            development: {
                entry: "./client/main.js",
                output: {
                    path: "client/bundle",
                    filename: "bundle.js"
                },
                module: {
                    loaders: [{
                        test: /\.css$/,
                        loader: "style-loader!css-loader"
                    }]
                }
            }
        },
        jsbeautifier: {
            beautify: {
                src: files,
                options: {
                    config: "./.jsbeautifyrc"
                }
            },
            verify: {
                src: files,
                options: {
                    mode: "VERIFY_ONLY",
                    config: "./.jsbeautifyrc"
                }
            },
        },
        sass: {
            dist: {
                options: {
                    style: "expanded"
                },
                files: [{
                    expand: true,
                    cwd: "client/css/",
                    src: ["*.scss"],
                    dest: "client/css/",
                    ext: ".css"
                }]
            }
        }
    });

    grunt.registerTask("startServer", "Task that starts a server attached to the Grunt process.", function() {
        var cmd = process.execPath;
        process.env.DEV_MODE = true;
        serveProc = child_process.spawn(cmd, ["server.js"], {
            stdio: "inherit",
        });
    });
    grunt.registerTask("killServer", "Task that stops the server if it is running.", function() {
        if (serveProc) {
            serveProc.kill();
        }
    });

    //TODO : set production environment variable on deployment platform
    if (process.env.NODE_ENV === "production") {
        grunt.registerTask("build", ["sass", "webpack:production"]);
    } else {
        //same as production but with no minification to help debugging
        grunt.registerTask("build", ["sass", "webpack:development"]);
    }
    grunt.registerTask("restartServer", ["killServer", "startServer"]);
    grunt.registerTask("check", ["jshint", "jscs:verify", "jsbeautifier:verify"]);
    grunt.registerTask("beautify", ["jscs:fix", "jsbeautifier:beautify"]);
    grunt.registerTask("test", ["check", "build", "jasmine_nodejs", "jasmine"]);
    grunt.registerTask("fixAndTest", ["beautify", "test"]);
    grunt.registerTask("default", ["fixAndTest"]);
};
