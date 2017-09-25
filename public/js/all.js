/* eslint-disable */
$(document).ready(function() {
	if(window.location.hash.indexOf('loginFailed') > 0){
		$('#loginFailed').text('驗證失敗，帳號密碼錯誤？');
		$('#loginFailed').show();
	}else if(window.location.hash.indexOf('registerSuccess') > 0){
		$('#loginFailed').text('註冊成功，請重新登入');
		$('#loginFailed').show();
	}
	$('#login').on('submit', function(){
		$('input[name=password]').val(md5($('input[name=password]').val()));
	});

	$('#formSuggest').on('submit', function(){
		if (!$('#checkSuggest').is(':checked')){
			return false;
		} else {
			$('#btnSuggest').text('資料送出中');
			$('#btnSuggest').prop('disabled', true);
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

		var deleteCourse = function() {
			$.ajax({
				url: '/suggest/'+id,
				type: 'delete',
				dataType: 'application/json; charset=utf-8',
				complete: function(res) {
					var result = $.parseJSON(res.responseText).result;
	
					if (result === 0) {
						showMsg('刪除課程', '取消成功', '確定', null, closeMsg);
						location.reload();
						return false;
					} else if (result === -1) {
						showMsg('刪除課程', '你還沒登入哦！', '確定', null, closeMsg);
						$(location).attr('href', '/login');
						return false;
					} else if (result === -2) {
						showMsg('刪除課程', '課程不存在哦！', '確定', null, closeMsg);
						return false;
					} else if (result === -3) {
						showMsg('刪除課程', '你似乎不是管理員哦！', '確定', null, closeMsg);
						return false;
					}
	
				}
			});
		}
		/* Act on the event */

		// showMsg(title, msg, ok, no, todoOk, todoNo, todo)
		showMsg('確定要刪除嗎？', '刪除救回不來了哦！', '好的', '不要', deleteCourse, closeMsg);

		
	});

	$('body').on('click', '.vote', function(event) {
		event.preventDefault();
		var id = $(this).data('id');
		var thisElement=$(this);

		$.post('/alp/vote/'+id, function(res) {
			if (res.result === 0) {
				var coursesCountText = thisElement.parent().find('.courses-count').text().split('人');
				thisElement.removeClass().addClass("btn btn-danger anti-vote").text("我要取消" + coursesCountText[1]);
				thisElement.parent().find('.courses-count').text((parseInt(coursesCountText[0]) + 1) + '人' + coursesCountText[1]);
				showMsg('投票', '投票成功', '確定', null, closeMsg);
				return false;
			} else if(res.result === -1){
				showMsg('投票', '你還沒登入哦！', '確定', null, closeMsg);
				$(location).attr('href', '/login');
				return false;
			} else if(res.result === -2) {
				showMsg('投票', '你已經投過票囉！', '確定', null, closeMsg);
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
						showMsg('取消投票', '取消成功！', '確定', null, closeMsg);
						return false;
					} else if (result === -1) {
						showMsg('取消投票', '你還沒登入哦！', '確定', null, closeMsg);
						$(location).attr('href', '/login');
						return false;
					} else if (result === -2) {
						showMsg('取消投票', '你還沒投票怎麼能夠退票R！', '確定', null, closeMsg);
						return false;
					}
				}
			});
	});
	
	$('.nextstage').on('click', function() {
		var id = $(this).data('id')
		$.ajax({
			type: 'GET',
			url: '/alp/admin/nextstage/' + id,
			datatType: 'application/json; charset=utf-8',
			complete: function(res) {
				res = $.parseJSON(res.responseText);

				if(res.result === 0) {
					showMsg('成功', '操作成功！', '確定', null, function() { location.reload(); });
				} else {
					showMsg('Oops', '操作失敗，請聯絡網站管理人員', '確定', null, closeMsg);
				}
			}
		});
	});

	$('.showPeople').on('click', function(){
		var id = $(this).data('id');
		$.ajax({
			type: 'GET',
			url: '/alp/admin/getpeople/'+id,
			dataType: 'application/json; charset=utf-8',
			complete: function(res){
				res = $.parseJSON(res.responseText);
				if(res.result === 0){
					showMsg('查詢結果', res.text, '關閉', null, closeMsg);
				}else{
					showMsg('查詢失敗', '找不到結果', '關閉', null, closeMsg);
				}
			}
		})
	});
});

var nextDialog = [];
function showMsg(title, msg, ok, no, todoOk, todoNo, todo){
	nextDialog.push(title);
	$('.msg-title').text(title);
	$('.msg-content').html(msg);
	$('.msg-ok').text(ok);
	$('.msg-no').text(no);
	$('.msg-wrapper').show(0);
	$('.msg-ok').on('click', todoOk);
	$('.msg-no').on('click', todoNo || closeMsg);
	if(no==null){
		$('.msg-ok').css('width', '100%');
		$('.msg-no').css('width', '0');
	}else{
		$('.msg-ok').css('width', '50%');
		$('.msg-no').css('width', '50%');
	}
	animateCss($('.msg'), 'bounceInDown');
	$(document).off('keypress');
	var todoOk = todoOk;
	var todoNo = todoNo || closeMsg;
	$(document).on('keypress', function(e){
		// if(e.which==13) todoOK();
		if(e.which==27) todoNo();
	});
	if(todo) todo();
}

function closeMsg(){
	if(nextDialog.length<1){
		animateCss($('.msg'), 'fadeOutUp', function(){$('.msg-wrapper').hide(0);});
		$(document).off('keypress');
	}
	nextDialog.pop();
}
$('.msg-close').on('click', closeMsg);

function animateCss(element, animate, todo){
	var todo = todo;
	var animate = animate;
	element.addClass('animated ' + animate);
	element.on('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){
		$(this).removeClass('animated ' + animate);
		if(typeof todo !== 'undefined') {
			todo();
			todo = undefined;
		}
	});
}