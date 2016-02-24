/**
 * Created by kadir on 17.12.2015.
 */
// public/core.js
var mainApp = angular.module('mainApp', ["ui.bootstrap", 'ui.map', 'ui.event', 'environment']);

mainApp.run(function ($rootScope) {
    console.log("MainApp run");
});

mainApp.config(function(envServiceProvider) {
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

mainApp.factory('SharedProps', function ($rootScope, envService) {
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

/*
Slider is globally accessed by other controllers
 */
/*var slider;
$(function() {
    slider = $("#left-panel").slideReveal({
        // width: 100,
        //height : 200,
        push: false,
        position: "left",
        speed: 600,
        trigger: $("#left-panel-trigger"),
        // autoEscape: false,
        shown: function(obj){
            obj.find(".handle").html('<span class="glyphicon glyphicon-chevron-left"></span>');
            //obj.addClass("left-shadow-overlay");
        },
        hidden: function(obj){
            obj.find(".handle").html('<span class="glyphicon glyphicon-chevron-right"></span>');
            //obj.removeClass("left-shadow-overlay");
        }
    });
    slider.slideReveal("hide");
});*/