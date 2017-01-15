$(document).ready(function() {
	$('#login').on('submit', function(){
		$('input[name=password]').val(md5($('input[name=password]').val()));
	});

	$('.delete-course').on('click', function(event) {
		event.preventDefault();
		var id = $(this).data('id');
		var pathname = window.location.pathname;
		console.log(pathname);

		$.ajax({
			url: '/suggest/'+id,
			type: 'delete',
			data: {next: pathname},
			dataType: 'application/json; charset=utf-8',
			complete: function(res) {
				console.log($.parseJSON(res.responseText).result);
			}
		});
		/* Act on the event */
	});

	$('.vote').on('click', function(event) {
		event.preventDefault();
		var id = $(this).data('id');
		console.log(id);
		// $.ajax({
		// 	url: '/vote/'+id,
		// 	type: 'delete',
		// 	dataType: 'application/json; charset=utf-8',
		// 	complete: function(res) {
		// 		console.log($.parseJSON(res.responseText).result);
		// 	}
		// });
		
		$.post('/vote/'+id, function(res) {
			console.log(res.result);
			if (res.result === 0) {
				alert('投票成功！');
				return false;
			} else if(res.result === -1){
				alert('你還沒登入哦！');
				$(location).attr('href', '/login');
				return false;
			} else if(res.result === -2) {
				alert('你已經投過票囉！');
				return false;
			}
		});
	});


	$('.anti-vote').on('click', function(event) {
		var id = $(this).data('id');

		$.ajax({
				url: '/vote/'+id,
				type: 'delete',
				dataType: 'application/json; charset=utf-8',
				complete: function(res) {
					var result = $.parseJSON(res.responseText).result;

					if (result === 0) {
						alert('成功！');
						return false;
					} else if (result === -1) {
						alert('你還沒登入哦！');
						$(location).attr('href', '/login');
						return false;
					} else if (result === -2) {
						alert('你還沒投票怎麼能夠退票R！');
						return false;
					}
				}
			});
	});
});