$(document).ready(function() {
	$('#login').on('submit', function(){
		$('input[name=password]').val(md5($('input[name=password]').val()));
	});

	$('#vote').on('click', function(event) {
		event.preventDefault();
		var id = $(this).data('id');
		console.log(id);
	});
});