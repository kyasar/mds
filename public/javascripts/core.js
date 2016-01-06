/**
 * Created by kadir on 17.12.2015.
 */
// public/core.js
var mainApp = angular.module('mainApp', ["ui.bootstrap", 'ui.map', 'ui.event']);

mainApp.run(function ($rootScope) {
    console.log("MainApp run");
    /*$rootScope.$on('scope.stored', function (event, data) {
     console.log("scope.stored", data);
     });*/
});

mainApp.config(function config() {
    console.log("MainApp config");
});

mainApp.factory('MainService', function ($rootScope) {
    var mem = {};
    var mdsURL = "http://localhost:8000";

    console.log("MainService created..");

    return {
        storeScope: function (key, value) {
            $rootScope.$emit('scope.stored', key);
            mem[key] = value;
        },
        getScope: function (key) {
            return mem[key];
        },
        getServerURL: function() {
            return mdsURL;
        }
    };
});

$(function() {
    var slider = $("#left-panel").slideReveal({
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