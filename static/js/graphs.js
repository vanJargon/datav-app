colorFilters = {"acute_bronchitis":"#feebe2","asthma":"#fcc5c0","asthmatic_bronchitis":"#fa9fb5","aurti":"#f768a1","bronchitis":"#c51b8a","pneumonia":"#7a0177","aqi":"#ffffcc","pm2_5":"#c7e9b4","pm10":"#7fcdbb","so2":"#41b6c4","no2":"#1d91c0","co":"#225ea8","o3":"#0c2c84"};

function makeComparisonChart(filterDisease,filterAir) {
	var width = 840;
	var height = 120;
	var barPadding = 1;

	var dateFormat = d3.time.format("%Y-%m-%d");

	var xScale = d3.time.scale()
		.range([0,width-50]);

	var yScaleDisease = d3.scale.linear()
		.range([height,0]);

	var yScaleAir = d3.scale.linear()
		.range([0,height]);

	var xAxis = d3.svg.axis()
		.scale(xScale)
		.orient("top");

	var yAxisDisease = d3.svg.axis()
		.scale(yScaleDisease)
		.orient("left")
		.ticks(5);

	var yAxisAir = d3.svg.axis()
		.scale(yScaleAir)
		.orient("left")
		.ticks(5);

	var svgDisease = d3.select("body").select("#comparison-chart")
		.append("svg")
		.attr("class","chart-comparison")
		.attr("id","chart-comparison-disease")
		.attr("width",width)
		.attr("height",height);

	var svgAir = d3.select("body").select("#comparison-chart")
		.append("svg")
		.attr("class", "chart-comparison")
		.attr("id", "chart-comparison-air")
		.attr("width", width)
		.attr("height", height + 20);

	d3.json("/datasets/disease", function(error, datasetDisease) {
		datasetDisease.forEach(function(d) {
			d["date"] = dateFormat.parse(d["date"]);
			d["total"] = 0;
			for (i=0;i<filterDisease.length;i++) {
				d["total"] += d[filterDisease[i]];
			};
		});

		var ndxDisease = crossfilter(datasetDisease);
		var dateDimDisease = ndxDisease.dimension(function(d) {return d["date"];});
		var total_disease = dateDimDisease.group().reduceSum(function(d) {return d["total"];});

		var datasetDisease_formatted = total_disease.all();

		xScale.domain([new Date(datasetDisease_formatted[0]["key"]), new Date(datasetDisease_formatted[datasetDisease_formatted.length -1]["key"])]);
		yScaleDisease.domain([0,d3.max(datasetDisease_formatted,function(d) {return d["value"];})]);

		svgDisease.selectAll("rect")
			.data(datasetDisease_formatted)
			.enter()
			.append("rect")
			.attr("class","rect-disease")
			.attr("x", function(d) { return xScale(new Date(d["key"]));})
			.attr("y", function(d) { return yScaleDisease(d["value"]); })
			.attr("width", (width-50)/datasetDisease_formatted.length - barPadding)
			.attr("height", function(d) {
				return height - yScaleDisease(d["value"]);
			})
			.attr("fill", "#fcc5c0")
			.attr("transform", "translate(50,0)");

		svgDisease.append("g")
			.attr("class", "y axis")
			.attr("transform", "translate(30,0)")
			.call(yAxisDisease);

		svgDisease.append("text")
			.text("Disease Records")
			.attr("class","chart-comparison-label")
			.attr("x", 650)
			.attr("y", 25);

	});

	d3.json("/datasets/air", function(error, datasetAir) {
		datasetAir.forEach(function(d) {
			d["date"] = dateFormat.parse(d["date"]);
			d["total"] = 0;
			for (i=0;i<filterAir.length;i++) {
				d["total"] += d[filterAir[i]];
			};
		});

		var ndxAir = crossfilter(datasetAir);
		var dateDimAir = ndxAir.dimension(function(d) {return d["date"];});
		var total_pollutants = dateDimAir.group().reduceSum(function(d) {return d["total"];});

		var datasetAir_formatted = total_pollutants.all();

		yScaleAir.domain([0, d3.max(datasetAir_formatted, function(d) {return d["value"];})])

		svgAir.selectAll("rect")
			.data(datasetAir_formatted)
			.enter()
			.append("rect")
			.attr("class","rect-air")
			.attr("x", function(d) { return xScale(new Date(d["key"]));})
			.attr("y",0)
			.attr("width", (width-50)/datasetAir_formatted.length - barPadding)
			.attr("height", function(d) {
				return yScaleAir(d["value"]);
			})
			.attr("fill", "#41b6c4")
			.attr("transform", "translate(50,0)");

		svgAir.append("g")
			.attr("class","x axis")
			.attr("transform", "translate(50," + (height+20) + ")")
			.call(xAxis);

		svgAir.append("g")
			.attr("class", "y axis")
			.attr("transform", "translate(30,0)")
			.call(yAxisAir);

		svgAir.append("text")
			.text("Air Pollutant")
			.attr("class","chart-comparison-label")
			.attr("x", 650)
			.attr("y", 100);
	});
};

function makeSpecificChart(filter,dimension) {
	var width = 840;
	var height = 220;
	var barPadding = 1;

	var dateFormat = d3.time.format("%Y-%m-%d");

	var dayOfWeekChart = dc.rowChart("#chart-day-of-week");
	var seasonChart = dc.pieChart("#chart-season");
	var areaChart = dc.lineChart("#chart-area");
	var timeChart = dc.barChart("#chart-time");

	if (dimension==="disease") {
		var regionDiseaseChart = dc.pieChart("#chart-region");
	}

	d3.json("/datasets/"+dimension, function(dataset) {
		dataset.forEach(function(d) {
			d["date"] = dateFormat.parse(d["date"]);
			d["total"] = 0;
			for (i=0;i<filter.length;i++) {
				d["total"] += d[filter[i]];
			};
		});

		var ndx = crossfilter(dataset);
		var dateDim = ndx.dimension(function(d) {return d["date"];});

		var dataset_formatted = {};

		for (i=0;i<filter.length;i++) {
			key = filter[i];
			dataset_formatted[key] = dateDim.group().reduceSum(function(d) {return d[key];});
		};

		var colorList = [];

		for (i=0;i<filter.length;i++){
			colorList.push(colorFilters[filter[i]]);
		}

		var total_count = dateDim.group().reduceSum(function(d) {return d["total"];});
		var minDate = dateDim.bottom(1)[0]["date"];
		var maxDate = dateDim.top(1)[0]["date"];

		var dayOfWeek = ndx.dimension(function(d) {
			var day = d["date"].getDay();
			var name = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
			return day + '.' + name[day];
		});

		var dayOfWeekGroup = dayOfWeek.group().reduceSum(function(d) {return d["total"];});

		var season = ndx.dimension(function(d) {
			var month = d["date"].getMonth();
			if (month>2 && month<=4) {
				return "Spring";
			} else if (month>4 && month<=7) {
				return "Summer";
			} else if (month>7 && month<=9) {
				return "Autumn";
			} else {
				return "Winter";
			}
		});

		var seasonGroup = season.group().reduceSum(function(d) {return d["total"];});

		dayOfWeekChart /*rendering day of week chart*/
		.width(2*width/3).height(height)
		.margins({top:10,right:0,bottom:25,left:40})
		.group(dayOfWeekGroup)
		.elasticX(true)
		.label(function (d) {return d.key.split('.')[1];})
		.dimension(dayOfWeek);

		// dayOfWeekChart.xAxis().ticks(5);/*end of day of week chart*/

		seasonChart /*rendering season chart*/
		.width(width/3).height(height)
		.radius(90)
		.innerRadius(35)
		.dimension(season)
		.group(seasonGroup); /*end of season chart*/

		areaChart /*rendering area chart!*/
		.width(width).height(height)
		.transitionDuration(1000)
		.margins({top:10,right:0,bottom:25,left:40})
		.renderHorizontalGridLines(true)
		.dimension(dateDim)
		.group(dataset_formatted[filter[0]]);

		for (var i=1;i<filter.length;i++) {
			areaChart.stack(dataset_formatted[filter[i]]);
		};

		areaChart
		.colors(colorList)
		.renderArea(true)
		.x(d3.time.scale().domain([minDate, maxDate]))
		.yAxisLabel(dimension)
		.elasticY(true)
		.brushOn(false);/* end of area chart */

		timeChart /*render time chart*/
		.width(width).height(50)
		.margins({top:10,right:0,bottom:25,left:50})
		.dimension(dateDim)
		.group(total_count)
		.centerBar(true)
		.gap(1)
		.x(d3.time.scale().domain([minDate, maxDate]));

		timeChart.yAxis().ticks(0);

		timeChart.on("filtered", function(chart) {
			dc.events.trigger(function() {
				areaChart.focus(chart.filter());
			});
		});

		if (dimension==="disease") {
			var region = ndx.dimension(function(d) {return d["region"];});
			var regionSum = region.group().reduceSum(function(d) {return d["total"];});

			regionDiseaseChart
			.width(width/4).height(height)
			.dimension(region)
			.group(regionSum)
			.label(function(d) {
				if (d.data.key === 1) {
					return "湖滨院区";
				} else {
					return "滨江院区";
				};
			})
			.radius(85)
			.colors(["#FF2B19","#FF7266"])
			.innerRadius(30);

			dayOfWeekChart.width(width/2);
			dayOfWeekChart.xAxis().ticks(5);

			seasonChart
			.width(width/4)
			.radius(85)
			.innerRadius(30);
		}

	dc.renderAll();
	});
};

function makePredictionChart(prediction_dataset) {
	console.log(prediction_dataset);
	var width = 500;
	var height = 270;
	var margin = {top: 20, right: 30, bottom: 30, left: 0};

	dataset = d3.entries(prediction_dataset);

	var xScale = d3.scale.ordinal()
					.domain(dataset.map(function(d) { return d.key; }))
					.rangeRoundBands([0,width],0.1);

	var yScale = d3.scale.linear()
					.domain([0,d3.max(dataset, function(d) {return d.value;})+20])
					.range([height,0]);

	var colors = d3.scale.ordinal()
					.domain(dataset.map(function(d) { return d.key; }))
					.range(["#feebe2","#fcc5c0","#fa9fb5","#f768a1","#c51b8a","#7a0177"]);

	var xAxis = d3.svg.axis()
		.scale(xScale)
		.orient("bottom");

	var yAxis = d3.svg.axis()
		.scale(yScale)
		.orient("left");

	var svg = d3.select("body").select(".prediction-chart")
		.append("svg")
		.attr("class", "chart-prediction")
		.attr("width", width+margin.left+margin.right)
		.attr("height", height+margin.top+margin.bottom);

	svg.append("g")
		.attr("class", "y axis")
		.call(yAxis)
		.attr("transform", "translate(30,0)")
		.append("text")
    	.attr("transform", "rotate(-90)")
    	.attr("y", 6)
    	.attr("dy", ".71em")
    	.style("text-anchor", "end")
    	.text("Estimated No. of Patients");

	svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(30,"+height+")")
		.call(xAxis);

	svg.selectAll(".bar")
		.data(dataset)
		.enter()
		.append("rect")
		.attr("class", "bar")
		.attr("x", function(d) { return xScale(d.key); })
		.attr("y", function(d) {return yScale(d.value); })
		.attr("height", function(d) { return height - yScale(d.value); })
		.attr("width", xScale.rangeBand())
		.style("fill", function(d) { return colors(d.key); })
		.attr("transform", "translate(30,0)");
};

function makeMapChart() {
	var width = 380;
	var height = 240;
	
	
	var canvas = d3.select("body").select(".map").append("svg")
	.attr("id","chart-map")
	.attr("width",width)
	.attr("height",height);
	

	d3.json("static/geojson/geohangzhou.json", function (data) {
		var group = canvas.selectAll("g")
			.data(data.features)
			.enter()
			.append("g");
		
		var projection = d3.geo.mercator()  
			.translate([width / 20, height / 200]) 
			.center([118.4,30.6]) 
			.scale(6500)
		//play with these. for center first var is right -, left +, second is up -, down +
		var path = d3.geo.path().projection(projection);
		
		var areas = group.append("path")
			.attr("d",path)
			.attr("class", "area")
			.attr("fill", "#272727")
			.attr("stroke", "#ECECEC")
			.attr("stroke-width", "0.35");
		
		group.append("text")
			.attr("class","map-labels")
			.attr("x", function (d) {return path.centroid(d)[0];})
			.attr("y", function (d) {return path.centroid(d)[1];})
			.text(function (d) {return d.properties.name;});

		canvas.append("text")
			.attr("id","hb")
			.attr("class", "map-markers")
			.attr("font-family","FontAwesome")
			.text(function(d) {return '\uf041'})
			.attr("fill", "#FF0000")
			.attr("x", 205)
			.attr("y", 65);

		canvas.append("text")
			.attr("id","bj")
			.attr("class", "map-markers")
			.attr("font-family","FontAwesome")
			.text(function(d) {return '\uf041'})
			.attr("fill", "#FF0000")
			.attr("x", 220)
			.attr("y", 75);

		canvas.append("text")
			.text("杭州")
			.attr("font-size","1.0em")
			.attr("x",250)
			.attr("y",175);
	})
};