var xlsx = require('node-xlsx');
var fs = require('fs');

var obj = xlsx.parse(__dirname + '/ornek.xlsx'); // parses a file 

 
//var obj = xlsx.parse(fs.readFileSync(__dirname + '/ornek.xlsx')); // parses a buffer

obj.forEach(function(entry) {
    entry.data.forEach(function(rec) {
        var item = rec;

        if (item[1].toString().length == 13 || item[1].toString().length == 8)
            console.log("Barcode: " + item[1] + " Name: " + item[2]);
    });
});
