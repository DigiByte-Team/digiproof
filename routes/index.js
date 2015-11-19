var express = require('express');
var router = express.Router();
var util = require("util");
var fs = require("fs"); 
var crypto = require('crypto');
var bitcore = require('bitcore');
var request = require('request');
var Document = require('../models/documents');

function createReceiveAddress(cb){
	var privateKey = new bitcore.PrivateKey();
	var address = privateKey.toAddress();
	return cb({PrivKey: privateKey.toString(), Addr: address.toString()})
}

function checkUTXO(address, cb){
	request('http://digiexplorer.info/api/addr/' + address + '/utxo', function(err, res, body){
	   var json = JSON.parse(body);
	   return cb(json[0]);
	});
}

function createTransaction(address, privkey, utxo, hash, cb){
	var amount = 100000000 - 5430;
	var opReturnTx = new bitcore.Transaction()
	.from(utxo)
	.to(address, amount)
	.addData(hash)
	.fee(5430)
	.sign(privkey)
	var txSerialized = opReturnTx.serialize(true);
	return cb(txSerialized);
}

function broadcastTransaction(rawtx, cb){
	request.post('http://digiexplorer.info/' + 'api/tx/send', { form: {rawtx: rawtx}}, function(err, res, body){
	    var json = JSON.parse(body);
	    return cb(json.txid)
	})
}

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

function findDocument(id, cb){
	Document.findOne({documentHash: id}, function(err, found){
		if(found){
			return cb(found.generatedAddr);
		} else {
			createReceiveAddress(function(addr){
				var newDocument = new Document({
					documentHash: id,
					generatedAddr: add.Addr,
					privKey: addr.PrivKey
				});
				newDocument.save(function(err, save){
					if(err){console.log(err)}
					return cb(newDocument.generatedAddr);
				});
			});
		}
	});
}


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.param('id', function(req,res, next, id){
	Document.findOne({documentHash: id}, function(err, found){
		if(found){
			req.address = found.generatedAddr;
			req.hash = id
			next();
		} else {
			createReceiveAddress(function(addr){
				var newDocument = new Document({
					documentHash: id,
					generatedAddr: addr.Addr,
					privKey: addr.PrivKey
				});
				newDocument.save(function(err, save){
					if(err){console.log(err)};
					req.hash = newDocument.documentHash;
					req.addr = newDocument.generatedAddr
					next();
				});
			});
		}		
	});
});

router.param('msg', function(req,res, next, msg){
	Document.findOne({documentMessage: msg}, function(err, found){
		if(found){
			req.address = found.generatedAddr;
			req.msg = found.documentMessage;
			next();
		} else {
			createReceiveAddress(function(addr){
				var newDocument = new Document({
					documentMessage: msg,
					generatedAddr: addr.Addr,
					privKey: addr.PrivKey
				});
				newDocument.save(function(err, save){
					if(err){console.log(err)};
					req.msg = newDocument.documentMessage;
					req.addr = newDocument.generatedAddr;
					next();
				});
			});
		}		
	});
});

router.get('/upload/:id', function(req, res){
	res.json({SHADigest: req.hash});
});

router.get('/message/:msg', function(req, res){
	res.json({Message: req.msg});
});

router.get('/txmsg/:txmsg', function(req, res, next) {
	Document.findOne({documentMessage: req.params.txmsg}, function(err, found){
		console.log(found);
		if(!found){
			res.render('invalid', {documentHash: req.params.txmsg})
		} else if (found.txSent){
			res.render('broadcasted', { transaction: found.txid });
		} else if (found.documentMessage) {
			checkUTXO(found.generatedAddr, function(utxo){
				if(!utxo){
						res.render('payments', { addr: found.generatedAddr, documentHash: found.documentMessage });
				} else {
					createTransaction(found.generatedAddr, found.privKey, utxo, req.params.txmsg, function(rawtx){
						broadcastTransaction(rawtx, function(broadcasted){
							console.log(broadcasted)
							found.txSent = true;
							found.txid = broadcasted;
							found.save(function(err, save){
								if(err){console.log(err)};
								res.render('broadcasted', { transaction: broadcasted });
							});
						});
					});
				}
			});
		}
	});
});

router.get('/document/:hash', function(req, res, next) {
	Document.findOne({documentHash: req.params.hash}, function(err, found){
		if(!found){
			res.render('invalid', {documentHash: req.params.hash})
		} else if (found.txSent){
			res.render('broadcasted', { transaction: found.txid });
		} else if (found.documentHash) {
			checkUTXO(found.generatedAddr, function(utxo){
				if(!utxo){
						res.render('payments', { addr: found.generatedAddr, documentHash: found.documentHash });
				} else {
					createTransaction(found.generatedAddr, found.privKey, utxo, req.params.hash.substring(0, 40), function(rawtx){
						broadcastTransaction(rawtx, function(broadcasted){
							console.log(broadcasted)
							found.txSent = true;
							found.txid = broadcasted;
							found.save(function(err, save){
								if(err){console.log(err)};
								res.render('broadcasted', { transaction: broadcasted });
							});
						});
					});
				}
			});
		}
	});
});

module.exports = router;
