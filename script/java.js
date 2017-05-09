(function () {   'use strict';
	var View = document.getElementById('svgContainer');
	var width = View.clientWidth;
	var height = View.clientHeight;
	var radius = Math.min(width, height) / 2;
	var x = d3.scale.linear()
		.range([0,2*Math.PI]);
	var y = d3.scale.linear()
		.range([0,radius]);
	var color = d3.scale.category20c();
	//Make the svg, attach it to the page, and center it.
	var svg = d3.select("div").append("svg")
		.attr("width", width)
		.attr("height", height)
		.append("g")
		.attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")");

	d3.json('res/classic.json',function(json){
		var collection = json.Cards;
		console.log(collection);
	});
}());
