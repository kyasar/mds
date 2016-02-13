var xlsx = require('node-xlsx');
var fs = require('fs');
//var ProductModel   = require('../libs/mongoose').ProductModel;
var config      = require('../libs/config');
var async = require('async');
//var obj = xlsx.parse(fs.readFileSync(__dirname + '/ornek.xlsx')); // parses a buffer

//lets require/import the mongodb native drivers.
var mongodb = require('mongodb');

//We need to work with "MongoClient" interface in order to connect to a mongodb server.
var MongoClient = mongodb.MongoClient;

// Connection URL. This is where your mongodb server is running.
var url = 'mongodb://localhost:27017/mddb';

var excel_file = undefined;
// print process.argv
process.argv.forEach(function (val, index, array) {
    if (index == 2) {
        console.log(index + ': ' + val);
        excel_file = val;
    }
});

if (excel_file == undefined)    return;
var obj = xlsx.parse(__dirname + val); // parses a file

// Use connect method to connect to the Server
MongoClient.connect(url, function (err, db) {
    var count = 0, fail = 0;
    if (err) {
        console.log('Unable to connect to the mongoDB server. Error:', err);
    } else {
        //HURRAY!! We are connected. :)
        console.log('Connection established to', url);

        // do some work here with the database.

        // Get the documents collection
        var collection = db.collection('products');

        async.series([
            function(callback){
                // do some more stuff ...
                obj.forEach(function(entry) {
                    entry.data.forEach(function(rec) {
                        if ((rec[1].toString().length == 13 || rec[1].toString().length == 8)
                            && rec[2] != undefined ) {
                            var product
                                = {
                                barcode: rec[1].toString(),
                                name: rec[2].toString()
                            };

                            // Insert some users
                            collection.insert(product, function (err, result) {
                                 if (err) {
                                     fail++;
                                    console.log(err);
                                 } else {
                                    console.log('Inserted %d documents into the "users" collection. The documents inserted with "_id" are:', result.length, result);
                                     count++;
                                 }
                             });

                            //console.log("Barcode: " + product.barcode + " Name: " + product.name);
                        }
                    });
                });
                callback(null, 'two');
            }
        ],

        function(err, results){
            // results is now equal to ['one', 'two']
            //db.close();
            console.log("DB closed. Succ: " + count + " Fail: " + fail);
        });
    }
});

/**/
