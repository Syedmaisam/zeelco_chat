const mysql = require("mysql");

var pool = mysql.createConnection({
  host: "localhost",
  user: "junaid",
  password: "junaid4422",
  database: "gtb2bexim_online_acd",
});

// var con = mysql.createConnection({
//     host     : 'localhost',
//     user     : 'foloroot',
//     password : '34698@@Ikenna@',
//     database : 'admin_foloshop',

// });

pool.connect(function (err) {
  if (err) {
    console.log(err,"DATABASE ERROR");
  }
});

module.exports = pool;
