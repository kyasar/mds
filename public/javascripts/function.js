$(document).ready(function () {
    $(function () {
        $('#dl-menu').dlmenu();
    });
    $("input.searchInput").on("keydown change", function () {
        if ($(".searchInput").val() != "") {
            $(".deleteBtn").css({
                "display": "block"
            });
            $(".searchInput").css({
                "background-color" : "#FFF"
            });

        } else {
            $(".deleteBtn").css({
                "display": "none"
            });
            $(".glyphicon").css({
                "display": "none"
            });
        }
    });
    $(".deleteBtn").click(function () {
        $(".searchInput").val("");
        $(".deleteBtn").css({
            "display": "none"
        });
    });
});