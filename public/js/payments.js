$(document).ready(function() {
	var addr = $('#addr').html();
	var uri = 'digibyte:'+ addr +'?amount=1';
	var qrcode = new QRCode('qrcode', {
        text: uri,
        width: 256,
        height: 256,
        correctLevel : QRCode.CorrectLevel.H
    });
});