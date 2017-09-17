//global vars
var q = 0,
	timer = null;

$(function() {
	//load skills and build inputs
	loadSkills();

	//tabs
	$("nav ul li a").on("click", function(e) {
		e.preventDefault();
		var target = $(this).attr("href");
		
		//reset views
		$(".panel").removeClass("open").hide();
		$("nav ul li a").removeClass("selected");
		$("#review").text("");

		//update views
		$(target).show().addClass("open");
		$(this).addClass("selected");
	});

	//accordion
	$(".questions").on("click", ".question h3", function(e) {
		e.preventDefault();
		$(this).parent().toggleClass("open");
	});

	//activate slider
	$(".questions").on("click", ".question ul li[data-input-type] input[type=checkbox]", function() {
		$(this).parent("li").toggleClass("selected");
	});

	//change slider values
	$(".questions").on("change", ".question input[type=range]", function() {
		$(this).next("span").text(getSkillLevel($(this).val()));
	});

	//build review
	$(".review a").on("click", function(e) {
		e.preventDefault();
		buildReview($(".panel.open").data("assessment"));
	});

	//copy review
	$(".review .copy").on("click", function(e) {
		e.preventDefault();
		copyToClipboard($("#review"));
	});
});

function loadSkills() {
	//adult
	$.ajax({
		dataType: "json",
		url: "js/adult-skills.json",
		success: function(adultData) {
			buildQuestions(adultData);
		},
		complete: function() {
			//child
			$.ajax({
				dataType: "json",
				url: "js/child-skills.json",
				success: function(childData) {
					buildQuestions(childData);
				},
				error: function(a,b,c) {
					//alert(a + ", " + b + ", " + c);
				}
			});				
		},
		error: function(a,b,c) {
			//alert(a + ", " + b + ", " + c);
		}
	});
}

function buildQuestions(data) {
	var client = data.client;

	//parse the skill list and build inputs
	$.each(data.assessment, function(key, value) {
		$("#" + client + "-review .questions").append('<div class="question"></div>');
		$("#" + client + "-review .questions .question:last-child").append('<h3 title="' + value.category + '">' + value.category + ' <i class="fa fa-caret-down"></i></h3>');

		//build either groups or skills
		if(value.groups != undefined && value.skills != undefined) {
			//category has both skills and groups...build skills first then groups
			buildInputs(value.skills, client);

			$.each(value.groups, function(k, v) {
				$("#" + client + "-review .questions .question:last-child").append('<h4>' + v.group + '</h4>');
				buildInputs(v.skills, client);
			});					
		}
		else {
			if (value.groups != undefined) {
				//category only has groups
				$.each(value.groups, function(k, v) {
					$("#" + client + "-review .questions .question:last-child").append('<h4>' + v.group + '</h4>');
					buildInputs(v.skills, client);
				});
			}
			else {
				//category only has skills
				buildInputs(value.skills, client);
			}
		}
	});	
}

function copyToClipboard(input) {
	if (navigator.userAgent.match(/ipad|ipod|iphone/i)) {
	  var element = input.get(0),
	  	  editable = element.contentEditable,
	  	  readOnly = element.readOnly,
	  	  range = document.createRange(),
	  	  selection = window.getSelection();

	  element.contentEditable = true;
	  element.readOnly = false;
	  range.selectNodeContents(element);
	  selection.removeAllRanges();
	  selection.addRange(range);
	  element.setSelectionRange(0, 999999);
	  element.contentEditable = editable;
	  element.readOnly = readOnly;
	} 
	else {
	  input.select();
	}
	document.execCommand('copy');
	input.blur();	

	//show confirmation
	showConfirmation();
}

function showConfirmation() {
	clearTimeout(timer);
	var message = $(".review .message");

	message.removeClass("active").addClass("active");
	timer = setTimeout(function() {
		message.removeClass("active");
	}, 3000);	
}

function buildInputs(skills, client) {
	$("#" + client + "-review .questions .question:last-child").append('<ul></ul>');
	$.each(skills, function(k, v) {
		buildInput(v, client);
	});	
}

function buildInput(skill, client) {
	q++;
	var checkbox = '<input type="checkbox" id="q' + q + '" name="q' + q + '" />',
		label = '<label for="q' + q + '">' + skill.skill + '</label>',
		range = '<div class="range"><input type="range" id="range' + q + '" name="range' + q + '" min="0" max="4" value="2" step="1" /><span>Moderate Supervision</span></div>',
		extra_input = '',
		literal = '',
		quote = '',
		isRange = skill.range;

	switch(skill.type) {
		case "fill":
			extra_input = '<input type="text" class="fill" placeholder="' + skill.placeholder + '" />';
			break;	

		case "multi":
			extra_input = buildMulti(skill.options);
			break;

		case "dropdown":
			extra_input = buildDropdown(skill.options);
			break;

		case "yesno":
			extra_input = '<input type="radio" name=q' + q + ' value="yes" /> Yes <input type="radio" name="q' + q + '"" value="no" /> No';
			break;						

		default:
			break;
	}

	if (isRange == false) {
		range = '';
	}

	if (client == "child") {
		range = "";
		extra_input += ' <label class="attempts" for="a' + q + '"># of attempts</label> <input type="number" id="a' + q + '" name="a' + q + '"" /> out of <input type="number" id="aa' + q + '" name="aa' + q + '"" /> with a proficiency of <input type="number" id="aaa' + q + '" name="aaa' + q + '"" />%';
	}

	skill.literal == undefined ? literal = false : literal = skill.literal;
	skill.quote == undefined ? quote = false : quote = skill.quote;
	skill.range == undefined ? isRange = true : isRange = skill.range;

	//build list item to be added
	var assessment_list = $("#" + client + "-review .questions .question:last-child ul:not(.multi-list)"),
	 	assessment_list_item = '<li data-input-type="' + skill.type + '" data-literal="' + literal + '" data-quote="' + quote + '" data-range="' + isRange + '">' + checkbox + ' ' + label + ' ' + extra_input + ' ' + range + '</li>';

	assessment_list.append(assessment_list_item);
}

function buildReview(client) {
	var reviewBox = $("#review"),
		review = "";

	//reset
	reviewBox.text("");

	//get completed fields
	var clientName = $("#" + client + "-client-name").val(),
		clientFeedback = $("#" + client + "-client-feedback").val(),
		lessonGoal = $("#" + client + "-lesson-goal").val(),
		workPerformed = $("#" + client + "-work-performed").val(),
		upcomingPlan = $("#" + client + "-upcoming-plan").val();

	review = getDate() + "\n";

	if ($.trim(clientName) != "") {
		review += "Client: " + clientName + "\n";
	}

	review += "\n";

	if ($.trim(lessonGoal) != "") {
		review += "The COMS met with the client for " + undercase(lessonGoal) + ".  ";
	}		

	if ($.trim(clientFeedback) != "") {
		review += 'The client described their vision in the following manner, "' + clientFeedback + '."  ';
	}	

	if ($.trim(workPerformed) != "") {
		review += " " + workPerformed + ".  ";
	}		

	//get checked assessment questions and build appropriate response
	$(".panel.open .question li.selected").each(function() {
		var checkbox = $(this).find("input[type=checkbox]:first-child"),
			label = $(this).find("label").text(),
			range = getSkillLevel($(this).find("input[type=range]").val()).toLowerCase(),
			input_type = $(this).data("input-type"),
			is_literal = $(this).data("literal"),
			is_quote = $(this).data("quote"),
			is_range = $(this).data("range"),
			input_label = "",
			new_label = "";

			is_literal == true ? input_label = label : input_label = "The client " + undercase(label);

		switch (input_type) {
			case "fill":
				is_quote == true ? input_label += '"' + $(this).find(".fill").val() + '"' : input_label += " " + $(this).find(".fill").val();			
			break;

			case "yesno":
				input_label += ": " + $(this).find("input[type=radio]:checked").val();
			break;

			case "dropdown":
				new_label = "The client utilized a " + input_label.toLowerCase() + " of " + $(this).find("select").val();
				input_label = new_label;
			break;

			case "multi":
				input_label += "test";
			break;

			default:
			break;
		}

		if (is_range) {
			if (range == "independently" || range == "dependently") {
				review += input_label + " " + range + ".  ";
			}
			else {
				review += input_label + " with " + range + ".  ";
			}		
		}
		else {
			review += input_label + ".  ";
		}
	});

	if ($.trim(upcomingPlan) != "") {
		review += " " + upcomingPlan + ".  ";
	}		

	//output
	reviewBox.text($.trim(review));
}

function getDate() {
	var today = new Date(),
		dd = today.getDate(),
		mm = today.getMonth() + 1,
		yyyy = today.getFullYear();

	if(dd < 10) {
	    dd = "0" + dd;
	} 

	if(mm < 10) {
	    mm = "0" + mm;
	} 

	today = mm + "/" + dd + "/" + yyyy;
	return today;	
}

function getSkillLevel(sliderValue) {
	var skill_level = "";

	switch(parseInt(sliderValue)) {
		case 0:
			skill_level = "Independently";
			break;

		case 1:
			skill_level = "Minimum Supervision";
			break;

		case 2:
			skill_level = "Moderate Supervision";
			break;

		case 3:
			skill_level = "Maximum Supervision";
			break;	

		case 4:
			skill_level = "Dependently";
			break;														

		default:
			break;
	}

	return skill_level;
}

function buildDropdown(options) {
	var select = '<select name="q' + q + '" id="q' + q + '">';
	for(var o = 0; o < options.length; o++) {
		select += "<option value='" + options[o].option + "'>" + options[o].option + "</option>";
	}
	select += '</select>';
	return select;
}

function buildMulti(options) {
	var checkboxes = '<div class="checkboxes"><ul class="multi-list">';
	for (var c = 0; c < options.length; c++)
	{
		checkboxes += '<li><input type="checkbox" name="q' + q + 'c' + c + '" id="q' + q + 'c' + c + '" /> <label for="q' + q + 'c' + c + '">' + options[c].option + '</label></li>';
	}
	checkboxes += '</ul></div>';
	return checkboxes;
}

function undercase(string) {
	var stringLower = string.charAt(0).toLowerCase() + string.substr(1);
	return stringLower;
}