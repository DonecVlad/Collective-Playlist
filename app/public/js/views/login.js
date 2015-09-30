$(document).ready(function(){
	$("#login-form").submit(function(event) {
		// Stop form from submitting normally
		event.preventDefault();
		
		var $form = $(this),
		email = $form.find("input[name='email']").val(),
		user = $form.find("input[name='user']").val(),
		pass = $form.find("input[name='password']").val();
		
		var posting = $.post("/login", {email:email, user:user, pass:pass});
		
		posting.success(function(responseText, status){          
			if (status == 'success') window.location.href = '/';
		}),
		posting.error(function(e){
			$("#response").empty().append("Введенные данные неверны");
		});
	});
})