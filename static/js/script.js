$(document).ready(function() {
	selectedDiseaseFilters = ["acute_bronchitis","asthma","asthmatic_bronchitis","aurti","bronchitis","pneumonia"];
	selectedAirFilters = ["aqi","pm2_5","pm10","so2","no2","co","o3"];

	remainingDiseaseFilters = [];
	remainingAirFilters = [];

	makeComparisonChart(selectedDiseaseFilters,selectedAirFilters);
	makeMapChart();
	drawFilterList();
	makePredictionChart({"acute_bronchitis": 76, "asthma": 194, "asthmatic_bronchitis": 267, "aurti": 1236, "bronchitis": 647, "pneumonia": 328 })

	/*-------Correlation Tabs--------------------------------------------------------------------------------------------*/
	$(".tab-link").on("click", function() {
		$(".tab-link").removeClass("active");
		$(".tab").removeClass("active");

		$(this).addClass("active");

		if ($("#tab-link-ca").hasClass("active")) {
			$("#correlation-analysis").addClass("active")
		} else {
			$("#prediction-tool").addClass("active")
		};
	});

	/*--------Prediction Tool -----------------------------------------------------------------------------------------*/
	$('a#submit-prediction-options').bind('click', function() {
		$.getJSON('/prediction/results', {
			input_aqi: $('input[name="aqi"]').val(),
			input_pm2_5: $('input[name="pm2_5"]').val(),
			input_pm10: $('input[name="pm10"]').val(),
			input_so2: $('input[name="so2"]').val(),
			input_no2: $('input[name="no2"]').val(),
			input_co: $('input[name="co"]').val(),
			input_o3: $('input[name="o3"]').val()
		}, function(data) {
			$('.prediction-chart').empty();
			makePredictionChart(data)
		});
		return false;
	});

	$(".prediction-option-range").on("change", function() {
		newValue = $(this).val();
		$(this).next().attr("value",newValue);
	});

	/*--------Filter---------------------------------------------------------------------------------------------------*/
	diseaseFilters = ["acute_bronchitis","asthma","asthmatic_bronchitis","aurti","bronchitis","pneumonia"];
	airFilters = ["aqi","pm2_5","pm10","so2","no2","co","o3"];

	function drawFilterList() {
		selectedFilters = selectedAirFilters.concat(selectedDiseaseFilters);

		for (var i=0;i<selectedFilters.length;i++) {
			$(".selected-filters").append("<div class='selected-filter-wrapper "+selectedFilters[i]+"'><p class = 'selected-filter-label'>" + selectedFilters[i] + "</p></div>");
			
			$('<div/ >')
				.addClass("selected-filter")
				.attr("id", selectedFilters[i])
				.css("background", colorFilters[selectedFilters[i]])
				.appendTo(".selected-filter-wrapper."+selectedFilters[i]);

		};
		//just to style filters into nice circular layout
		var elems = $(".selected-filter-wrapper");
		var increase = Math.PI * 2/elems.length;

		var x = 0, y = 0, angle = 0, elem;

		for (var i=0;i<elems.length;i++) {
			elem = elems[i];
			x = 60 * Math.cos(angle) + 150;
			y = 60 * Math.sin(angle) + 275;
			elem.style.position = "absolute";
			elem.style.left = x + "px";
			elem.style.top = y + "px";
			angle += increase;
		};
	};

	//Click to remove filters from box
	$(document).on("click", ".selected-filter", function() {
		key = $(this).attr("id")
		index = $.inArray(key,selectedDiseaseFilters); //test one filter type first 

		if (index>-1) {
			remainingDiseaseFilters.push(key);
			selectedDiseaseFilters.splice(index,1);
			$("<div>"+key+"</div>")
			.addClass("remaining-filter disease")
			.attr("id", key)
			.css("background", colorFilters[key])
			.appendTo(".remaining-filters.disease");
		} else {
			index = $.inArray(key,selectedAirFilters);
			remainingAirFilters.push(key);
			selectedAirFilters.splice(index,1);
			$("<div>"+key+"</div>")
			.addClass("remaining-filter air")
			.attr("id", key)
			.css("background", colorFilters[key])
			.appendTo(".remaining-filters.air");
		};

		$(".selected-filters").empty();
		drawFilterList();
	});

	//Click to add filters to box
	$(document).on("click", ".remaining-filter", function() {
		key = $(this).attr("id")
		index = $.inArray(key,remainingDiseaseFilters); //test one filter type first

		if (index>-1){
			remainingDiseaseFilters.splice(index,1);
			selectedDiseaseFilters.push(key);
		} else {
			index = $.inArray(key,remainingAirFilters);
			remainingAirFilters.splice(index,1);
			selectedAirFilters.push(key);
		};

		$(this).remove();

		$(".selected-filters").empty();
		drawFilterList();
	});

	//Hover to see label
	$(document).on("mouseenter",".selected-filter", function() {
		$(this).siblings(".selected-filter-label").css("visibility", "visible");
	});

	$(document).on("mouseleave",".selected-filter", function() {
		$(this).siblings(".selected-filter-label").css("visibility", "hidden");
	});

	//Submit filters
	$(".submit-filters").on("click", function() {
		if (selectedAirFilters.length<1 || selectedDiseaseFilters.length<1) {
			alert("Please select at least one air pollutant and disease type parameter.");
		} else {
			$(".chart-comparison").remove();

			makeComparisonChart(selectedDiseaseFilters,selectedAirFilters);

			$(".overview-tab-link").removeClass("active");
			$(".overview-tab").removeClass("active");

			$("#tab-link-comparison-chart").addClass("active");
			$("#comparison-chart").addClass("active");
			$("#tab-link-area-chart").addClass("null");
			$("#tab-link-bar-chart").addClass("null");
			$("#time-chart").remove();
		}
	});

	/*----------Overview Tabs-------------------------------------------------------------------------------------*/
	$(".overview-tab-link").on("click", function() {
		if ($("#tab-link-comparison-chart").hasClass("active")) {
			alert("Please select a data category.");
		} else {
			$(".overview-tab-link").removeClass("active");
			$(".overview-tab").removeClass("active");

			$(this).addClass("active");

			if ($("#tab-link-comparison-chart").hasClass("active")) {
				$("#comparison-chart").addClass("active");
				$("#tab-link-area-chart").addClass("null");
				$("#tab-link-bar-chart").addClass("null");
				$("#time-chart").remove();
				$("#chart-region").remove();
			} else if ($("#tab-link-bar-chart").hasClass("active")){
				$("#bar-chart").addClass("active")
			} else {
				$("#area-chart").addClass("active")
			};
		}
	});

	//Comparison Tool Tip
	$(document).on("mouseenter", ".chart-comparison > rect", function() {
		var mouseX = $(this).attr("x");

		$(".chart-comparison > rect").each(function() {
			rectX = $(this).attr("x");
			originalColor = $(this).attr("fill");

			if (Math.abs(rectX - mouseX)<80) {
				if ($(this).attr("height")>60) {
					$(this).css("fill","#00FF00 ")
				} else {
					$(this).css("fill","#FF0000")
				}
			} else {
				$(this).css("fill",originalColor);
			}
		});
	});

	$(document).on("mouseleave",".chart-comparison",function(){
		$(".rect-air").css("fill", "#41b6c4");
		$(".rect-disease").css("fill", "#fcc5c0");
	});

	$(document).on("click","#chart-comparison-disease", function() {
		$(".overview-tab-content").append("<div id = 'time-chart'><div id = 'chart-time'></div></div>");
		
		$(".overview-tab-link").removeClass("active");
		$(".overview-tab").removeClass("active");

		$(".overview-tab-link").removeClass("null");

		$("#tab-link-area-chart").addClass("active");
		$("#area-chart").addClass("active");

		$("#bar-chart").append("<div id = 'chart-region'></div>");
		makeSpecificChart(selectedDiseaseFilters,"disease");
	});

	$(document).on("click","#chart-comparison-air", function() {
		$(".overview-tab-content").append("<div id = 'time-chart'><div id = 'chart-time'></div></div>");
		makeSpecificChart(selectedAirFilters,"air");

		$(".overview-tab-link").removeClass("active");
		$(".overview-tab").removeClass("active");

		$(".overview-tab-link").removeClass("null");

		$("#tab-link-area-chart").addClass("active");
		$("#area-chart").addClass("active");
	});
});