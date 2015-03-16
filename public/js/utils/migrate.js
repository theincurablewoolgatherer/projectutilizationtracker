
$("#loadMH").click(function(){
	var url = "/api/manhour/"+$("input[name=_id]").val();
	console.log(url);
	$.getJSON(url, function(data) {
		var mh = data;
		var date = data.date;
		var timein =data.timein;
		var timeout = data.timeout;
		$("#old_date").text(date);
		$("#old_timein").text(timein);
		$("#old_timeout").text(timeout);
		date = new Date(date);
		date.setHours(date.getHours()+8);
		timein = new Date(timein);
		timein.setHours(timein.getHours()+8);
		timeout = new Date(timeout);
		timeout.setHours(timeout.getHours()+8);
		$("input[name=date]").val(date.toISOString());
		$("input[name=timein]").val(timein.toISOString());
		$("input[name=timeout]").val(timeout.toISOString());
	});

});

