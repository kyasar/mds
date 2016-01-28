/**
 * Created by kadir on 17.12.2015.
 */
// public/core.js
var mainApp = angular.module('mainApp', ["ui.bootstrap", 'ui.map', 'ui.event', 'widget.scrollbar']);

mainApp.run(function ($rootScope) {
    console.log("MainApp run");
});

mainApp.config(function config() {
    console.log("MainApp config");
});

mainApp.factory('SharedProps', function ($rootScope) {
    var mem = {};
    var mdsURL = "http://localhost:8000";
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
var slider;
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
});