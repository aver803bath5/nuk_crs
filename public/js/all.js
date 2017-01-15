$(document).ready(function() {
	$('#login').on('submit', function(){
		$('input[name=password]').val(md5($('input[name=password]').val()));
	});
});