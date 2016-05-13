
$(document).ready(function() {
	
	//ajax form submission
	$("#fileUpload").submit(function(e) {
		e.preventDefault();
		var frm = $(this), error = false, msg = "";
		frm.find("input,select").each(function() {
			if(!$(this).val()) {
				msg += "<b>" + $(this).prev().text() + " : is a required field </b><br>";
				error = true;
			}
		});
		if(error) {
			$("#errormsg").show().find("div").remove().end().find("button").after("<div>"+msg+"</div>");
			setTimeout(function() {
				if($("#errormsg").is(":visible")) {
					$("#errormsg").fadeOut("slow");
				}
			}, 5000);
			return;
		}
		if(!FormData) {
			msg = "Your browser do not support HTML5.";
			$("#errormsg").show().find("div").remove().end().find("button").after("<div>"+msg+"</div>");
		} else {
			$.ajax({
				url: '/upload/uploadFile',
				type: 'POST',
				data: new FormData(frm[0]),
				beforeSend: function() {
					frm.find("input,select").each(function() {
						$(this).attr("disabled", true);
					});
					$("#submitbtn").attr("disabled", true).text("Please wait...");
				},
				cache: false,
				contentType: false,
				processData: false,
				success: function (result) {
					if(result && result.status == "success") {
						$("#successmsg").show().find("div").remove().end().find("button").after("<div><b>"+result.message+"</b></div>");
						setTimeout(function() {
							if($("#successmsg").is(":visible")) {
								$("#successmsg").fadeOut("slow");
							}
						}, 5000);
					}
					frm.find("input,select").each(function() {
						$(this).removeAttr("disabled");
					});
					$("#submitbtn").removeAttr("disabled").text("Submit");
					frm[0].reset();
					getFiles();
				},
				error: function(result) {
					frm.find("input,select").each(function() {
						$(this).removeAttr("disabled");
					});
					$("#submitbtn").removeAttr("disabled").text("Submit");
					console.log(result);
				}
			});
		}
	});
	
	function getFiles() {
		$.ajax({
			url: '/upload/getUploadedFiles',
			type: 'GET',
			success: function (result) {
				if(result && result.status == "success") {
					var html = '';
					if(result.data && result.data.length) {
						$.each(result.data.split("@@"), function(a,b) {
							var f = b.split("__")[4].split(".").slice(0,2).join(".");
							html += '<tr><td>'+f+'</td><td><button class="btn btn-primary" data-file="'+b+'">Decrypt and Download</button><button class="btn btn-danger leftsp" data-file-del="'+b+'">Delete</button></td></tr>';
						});
						$("#fileList").find("tbody").html(html);
					} else {
						$("#fileList").find("tbody").html('<tr><td colspan="2" style="text-align:center;color:red;"><b>No Files Found</b></td></tr>');
					}
				} else {
					alert(result.message);
				}
			},
			error: function(result) {
				console.log(result);
			}
		});
	}
	getFiles();
	
	$(document).on("click", "button[data-file]", function() {
		var b = $(this), v = b.attr('data-file');
		var html = '<form class="form-inline downloadForm" method="post" action="/upload/downloadFile"><div class="form-group"><label for="key_'+v.split("__")[3]+'">Enter Key : </label><input type="text" class="form-control" id="key_'+v.split("__")[3]+'" name="key"></div><input type="hidden" name="file" value="'+v+'"><button type="submit" class="btn btn-default leftsp">Submit</button><a href="javascript:void(0);" class="btn btn-default canceldownload leftsp" id="'+v+'">Cancel</a></form>';
		b.next().remove().end().replaceWith(html);
	});
	
	$(document).on("click", "a.canceldownload", function() {
		var b = $(this), v = b.attr('id'), f = b.parents('form');
		var html = '<button class="btn btn-primary" data-file="'+v+'">Decrypt and Download</button><button class="btn btn-danger leftsp" data-file-del="'+v+'">Delete</button>';
		f.replaceWith(html);
	});
	
	$(document).on("submit", "form.downloadForm", function(e) {
		e.preventDefault();
		if(!$(this).find("input[type=text]").val().trim()) {
			$(this).find("input[type=text]").parent().addClass("has-error").find("input").off("focus").on("focus",function(){
				$(this).parent().removeClass("has-error");
			});
		} else {
			$(this)[0].submit();
		}
	});
	
	if(location.hash.length) {
		$("#fileList").parent().prepend('<div class="alert alert-danger" role="alert" id="invalidKey"><b>'+decodeURIComponent(location.hash).substr(1)+'<b></div>');
		location.hash = "";
		setTimeout(function() {
			if($("#invalidKey").length) {
				$("#invalidKey").remove();
			}
		}, 5000)
	}
	
	$(document).on("click", "button[data-file-del]", function() {
		var v = $(this).attr("data-file-del");
		if(confirm('Are you sure to delete this file "' + v.split("__")[4].split(".").slice(0,2).join(".") + '"')) {
			$.post("/upload/deleteFile", {filename:v} ).done(function(result) {
				if(result && result.status == "success") {
					$("#fileList").parent().prepend('<div class="alert alert-success" role="alert" id="smG"><b>File deleted successfully<b></div>');
					setTimeout(function() {
						if($("#smG").is(":visible")) {
							$("#smG").remove();
						}
					}, 5000);
					getFiles();
				} else {
					console.log(result);
				}
			}).fail(function(result) {
				console.log(result);
			});
		}
	});
	
	function getCiphers() {
		$.get("/upload/getCiphers").done(function(d){
			if(d && d.status == "success") {
				var html = "";
				if(d.data.split(",").length) {
					$.each(d.data.split(","), function(a,b) {
						html += '<option value="'+b+'">'+b+'</option>';
					});
					$('#ealgo').append(html);
				}
			}
			
		}).fail(function(r) {
			console.log(r);
		});
	}
	getCiphers();
});