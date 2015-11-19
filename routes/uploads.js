var express = require('express');
var router = express.Router();
var util = require("util");
var fs = require("fs"); 
var crypto = require('crypto');
var bitcore = require('bitcore');

function getCryptoDigest(uploadedFile, cb){
	var algo = 'sha256';
	var shasum = crypto.createHash(algo);

	var file = uploadedFile;
	var s = fs.ReadStream(file);
	s.on('data', function(d) { shasum.update(d); });
	s.on('end', function() {
	    var digest = shasum.digest('hex');
	    return cb(digest);
	});
}


router.get('/', function(req, res) {
  res.render("uploadPage", {title: "I love files!"});
}); 

router.post("/upload", function(req, res, next){
	if (req.file) {
		console.log(util.inspect(req.file));
		getCryptoDigest(req.file.path, function(hash){
			res.end(hash);
		});
	}
});

module.exports = router;