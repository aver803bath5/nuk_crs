$(document).ready(function() {
	$('#login').on('submit', function(){
		$('input[name=pass]').val(md5($('input[name=pass]').val()));
	});
});