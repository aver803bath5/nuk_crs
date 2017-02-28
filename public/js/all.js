/* eslint-disable */
$(document).ready(function() {
	if(window.location.hash.indexOf('loginFailed') > 0){
		$('#loginFailed').show();
	}
	$('#login').on('submit', function(){
		$('input[name=password]').val(md5($('input[name=password]').val()));
	});

	$('#formSuggest').on('submit', function(){
		if (!$('#checkSuggest').is(':checked')){
			return false;
		}
	});

	$('#checkSuggest').on('change', function(){
		if ($(this).is(':checked')) {
			$('#btnSuggest').addClass('ok').removeClass('disabled');
		}else{
			$('#btnSuggest').addClass('disabled').removeClass('ok');
		}
	});

	$('#listFilter').on('input', function(){
		$('.course').hide();
		$('.course').filter(function(){
			return $($(this).find('.courses-name')).text().indexOf($('#listFilter').val()) > -1
		}).show()
		if($('#listFilter').val() === '') $('.course').show();
	});

	$('.delete-course').on('click', function(event) {
		event.preventDefault();
		var id = $(this).data('id');
		var pathname = window.location.pathname;

		$.ajax({
			url: '/suggest/'+id,
			type: 'delete',
			dataType: 'application/json; charset=utf-8',
			complete: function(res) {
				var result = $.parseJSON(res.responseText).result;

				if (result === 0) {
					alert('取消成功！');
					location.reload();
					return false;
				} else if (result === -1) {
					alert('你還沒登入哦！');
					$(location).attr('href', '/login');
					return false;
				} else if (result === -2) {
					alert('課程不存在哦！');
					return false;
				} else if (result === -3) {
					alert('你似乎不是管理員哦！');
					return false;
				}

			}
		});
		/* Act on the event */
	});

	$('body').on('click', '.vote', function(event) {
		event.preventDefault();
		var id = $(this).data('id');
		var thisElement=$(this);
		// $.ajax({
		// 	url: '/vote/'+id,
		// 	type: 'delete',
		// 	dataType: 'application/json; charset=utf-8',
		// 	complete: function(res) {
		// 		console.log($.parseJSON(res.responseText).result);
		// 	}
		// });

		$.post('/vote/'+id, function(res) {
			if (res.result === 0) {
				var coursesCountText = thisElement.parent().find('.courses-count').text().split('人');
				thisElement.removeClass().addClass("btn btn-danger anti-vote").text("我要取消" + coursesCountText[1]);
				thisElement.parent().find('.courses-count').text((parseInt(coursesCountText[0]) + 1) + '人' + coursesCountText[1]);
				console.log($(this));
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


	$('body').on('click', ".anti-vote", function(event) {
		event.preventDefault();
		var id = $(this).data('id');
		var thisElement=$(this);

		$.ajax({
				url: '/vote/'+id,
				type: 'delete',
				dataType: 'application/json; charset=utf-8',
				complete: function(res) {
					var result = $.parseJSON(res.responseText).result;

					if (result === 0) {
						var coursesCountText = thisElement.parent().find('.courses-count').text().split('人');
						thisElement.removeClass().addClass("button ok vote").text("我要" + coursesCountText[1]);
						thisElement.parent().find('.courses-count').text((parseInt(coursesCountText[0]) - 1) + '人' + coursesCountText[1]);
						alert('取消成功！');
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
