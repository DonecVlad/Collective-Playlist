$(document).ready(function(){
	$("#reg-form").submit(function(event) {
		// Stop form from submitting normally
		event.preventDefault();
		
		var $form = $(this),
		term = $form.find("input[name='email']").val(),
		pass = $form.find("input[name='password']").val();
			
		var posting = $.post("/signup", {user: term, pass: pass});
		
		posting.success(function(responseText, status){          
			if (status == 'success') window.location.href = '/';
		}),
		posting.error(function(e){
			$("#response").empty().append("Введенные данные неверны");
		});
	});
})