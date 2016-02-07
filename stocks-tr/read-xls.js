var xlsx = require('node-xlsx');
var fs = require('fs');

var obj = xlsx.parse(__dirname + '/ornek.xlsx'); // parses a file 

 
//var obj = xlsx.parse(fs.readFileSync(__dirname + '/ornek.xlsx')); // parses a buffer

obj.forEach(function(entry) {
    entry.data.forEach(function(rec) {
        console.log(JSON.stringify(rec))
    });
});
