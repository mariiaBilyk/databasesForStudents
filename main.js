var database = "data/db.json";

$('.clickable').on('click',function(){
		var effect = $(this).data('effect');
		$(this).closest('.panel')[effect]();
	});
	var connections = [];
	var rand;
    
    function connect(first_table,second_table,first_con_type,second_con_type){
    	connections.push(new $.connect(first_table, second_table, {container : '.database-area',leftLabel : first_con_type, rightLabel: second_con_type}));	
    }

	$.getJSON( database, function(d) {
		}).done(function setRandomTest(data){
			rand = Math.floor(Math.random() * data.length);
			var defaultImg = "img/img.jpg";

			$(".panel-body").text(data[rand].text);

			$.each(data[rand].tables,function(i){
				var img = $('<img>');
				var paragraph = $('<p>');

				paragraph.text(data[rand].tables[i].title);

				img.attr('src', defaultImg);

				var list = $("<li class='ui-state-default drag'></li>")
					.attr('id',data[rand].tables[i].id)
					.attr('data-title',data[rand].tables[i].title)
					.append(paragraph)
					.append(img);
				
				$("#sortable").append(list);
			});
		});

	$(document).on("contextmenu",'.second',function(e) {
		e.preventDefault();
		var self = $(this);
		$('.second').each(function(){
			option = $('<option></option>').val($(this).attr("id")).text($(this).attr("data-title"));
			$('#select-table').append(option);
		});
	
		$("#connectModal").modal();
		$('.connect-btn').one('click',function(){
			// alert("connect");
			var table_id = $('#select-table').val();
		
			
            connect('#'+self.attr("id"),'#'+table_id,$('#select-connection-first').val(),$('#select-connection-second').val());
            $("#connectModal").modal("hide");
		});
		 $("#connectModal").on('hidden.bs.modal', function(){
			$('#select-table').empty();
		 });
	});

	function checkAnswer(){
		var tablesToCheck = [];
		var tablesCorrect = [];
		var connectionsToCheck = [];
		var connectionsCorrect = [];
		$(document).find('.second').each(function(){
			tablesToCheck.push(parseInt($(this).attr("id")));
		});
		connections.forEach(function(connection){
				connectionsToCheck.push({
					"tableLeftId": parseInt(connection.elem1[0].id),
					"tableRightId": parseInt(connection.elem2[0].id),
					"relationType": connection.Connector[0].innerText
				});
		});

		$.getJSON( database, function(d) {
		}).done(function (data){
			$.each(data[rand].tables,function(i){
				if (data[rand].tables[i].isCorrect)
					tablesCorrect.push(data[rand].tables[i].id);
			});
			$.each(data[rand].relations,function(i){
				connectionsCorrect.push(data[rand].relations[i]);
			});
			//var connectionsIntersect = _.intersectionObjects(connectionsToCheck, connectionsCorrect);
			var connectionsIntersect = _.intersectionWith(connectionsCorrect, connectionsToCheck, function (item1, item2) {
				if (item1.tableLeftId == item2.tableRightId && item1.tableRightId == item2.tableLeftId){
					switch(item1.relationType) {
						case "OneN":
							return item2.relationType == "NOne";
						case "NOne":
							return item2.relationType == "OneN";
						default:
							return item2.relationType == item1.relationType;
					}
				}
				return (item1.tableLeftId == item2.tableLeftId && item1.tableRightId == item2.tableRightId 
						&& item1.relationType == item2.relationType );
			});

			var tablesIntersect = _.intersection(tablesToCheck, tablesCorrect);
			//console.log(connectionsCorrect);
			// console.log(connectionsToCheck);
			var relationsPercentage;
			var tablesPercentage;
			if((connectionsToCheck.length-connectionsIntersect.length)
				+(connectionsCorrect.length-connectionsIntersect.length)/connectionsCorrect.length>=1){
				relationsPercentage = 0;
			}
			else 
				relationsPercentage = Math.floor((1 - ((connectionsToCheck.length-connectionsIntersect.length)
				+(connectionsCorrect.length-connectionsIntersect.length)/connectionsCorrect.length))*100);

			if((tablesToCheck.length-tablesIntersect.length)
				+(tablesCorrect.length-tablesIntersect.length)/tablesCorrect.length>=1){
				tablesPercentage = 0;
			}
			else 
				tablesPercentage = Math.floor((1 - ((tablesToCheck.length-tablesIntersect.length)
				+(tablesCorrect.length-tablesIntersect.length)/tablesCorrect.length))*100);

			var avg = (tablesPercentage + relationsPercentage) / 2;

			var degree = avg > 50 && avg < 71 ? "Задовільно"
						: avg > 71 && avg < 88 ? "Добре"
						: avg > 88 ? "Відмінно"
						: "Незадовільно";

			var result = {
				tablesResult: tablesPercentage,
				relationResult: relationsPercentage ,
				degree: degree
			};

			$('#resultModal').modal();

			$('.degree').text(result.degree);
			$('.tables-result').text(result.tablesResult  + '%');
			$('.relations-result').text(result.relationResult  + '%');
		});	
	}

	$('.check').on('click',function(){
		checkAnswer();
	});

	$(document).on("contextmenu",'.connector',function(e) {
		e.preventDefault();
		var self = $(this);
		connections.forEach(function(connection, index, object){
			if(connection.Connector[0] === self[0]) {
				self.remove();
				object.splice(index,1);
			}
		});
	});

	var reset = function(){
		 $( ".drag" ).draggable({
	    	revert: "invalid",
	    	helper: "clone",
	    	appendTo: ".database-area",
	    });

	    $(".database-area ul").droppable({
	    	accept: ".drag , .second",
	    	activate: function(event, ui){
	    		$( ".second" ).draggable({
	    			helper: "original",
	    			// containment: ".database-area",
	    			drag : function recalculate() {
			    		
						var item = this;
						connections.forEach(function(connection){
							if(connection.elem1[0] === item || connection.elem2[0] === item) {
								connection.calculate();
							}
						});
					},
					stop: function(){
						var item = this;
						connections.forEach(function(connection){
							if(connection.elem1[0] === item || connection.elem2[0] === item) {
								connection.calculate();
							}
						});
					}
			    });		    	
	    	},

	    	drop: function(event, ui) {
               // $(this).removeClass("border").removeClass("over");
	            var dropped = ui.draggable;
	            var droppedOn = $(this);
	            $(dropped).detach().css({"top":ui.position.top,"left":ui.position.left}).addClass("second").removeClass("drag").appendTo(droppedOn);  
	            
            }

	    });

	    $(".sidebar").droppable({
	    	accept: ".drag , .second",
	    	drop: function(event, ui) {
                $(this).removeClass("border").removeClass("over");
	            var dropped = ui.draggable; 
	            var droppedOn = $(this).find("#sortable");
	            $(dropped).detach().css({"top":ui.position.top,"left":ui.position.left}).addClass("drag").removeClass("second").appendTo(droppedOn);
	            reset();
            }
	    });
	}

	$( function() {
		reset();
	});

	function getAnswer(){	
		var tablesCorrect = [];
		var connectionsCorrect = [];
		$('.database-area ul').empty();
		$('#sortable').empty();
		var img = $('<img>');
		var defaultImg = "img/img.jpg";
		img.attr('src', defaultImg);

		$.getJSON( database, function(d) {
		}).done(function (data){
			$.each(data[rand].tables,function(i){
				if (data[rand].tables[i].isCorrect){
					// tablesCorrect.push(data[rand].tables[i].id);
					var paragraph = $('<p>');

					paragraph.text(data[rand].tables[i].title);
					var li = $("<li class='ui-state-default ui-draggable ui-draggable-handle second'><img src='img/img.jpg'></li>")
						.attr('id',data[rand].tables[i].id)
						.attr('data-title',data[rand].tables[i].title)
						.prepend(paragraph);
					li.css({"left":100+100*i+"px","top":100+50*i});
					$('.database-area ul').append(li);
				}
			});
			$.each(data[rand].relations,function(i){
				// connectionsCorrect.push(data[rand].relations[i]);
				var leftText, rightText;
				switch(data[rand].relations[i].relationType){
					case "NOne": leftText="N", rightText="One"; break;
					case "OneN": leftText="One", rightText="N"; break;
					case "NN": leftText="N", rightText="N"; break;
					case "OneOne": leftText="One", rightText="One"; break;
				}
				connect('#'+data[rand].relations[i].tableLeftId,'#'+data[rand].relations[i].tableRightId,leftText,rightText);
			}
			);
		
			$('#resultModal').modal('hide');
			$('.check').hide();
			
			$( ".second" ).draggable({
				helper: "original",
				// containment: ".database-area",
				drag : function recalculate() {
		    		
					var item = this;
					connections.forEach(function(connection){
						if(connection.elem1[0] === item || connection.elem2[0] === item) {
							connection.calculate();
						}
					});
				},
				stop: function(){
					var item = this;
					connections.forEach(function(connection){
						if(connection.elem1[0] === item || connection.elem2[0] === item) {
							connection.calculate();
						}
					});
				}
		    });
		});
	}