var mongoose = require('mongoose')
  , Schema = mongoose.Schema;
 
var DocumentsSchema = new Schema({
  documentHash: { type: String, index: true},
  documentMessage: { type: String, default: null },
  generatedAddr: { type: String },
  privKey: { type: String },
  txSent: { type: Boolean, default: false },
  txid: { type: String }
}, {id: false});

module.exports = mongoose.model('Documents', DocumentsSchema);
