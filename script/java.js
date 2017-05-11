(function () {   'use strict';
	var View = document.getElementById('svgContainer');
	var obj;
	var width = View.clientWidth;
	var height = View.clientHeight;
	var radius = Math.min(width, height) / 2-10;
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
	//Partition Layout Element
	var partition = d3.layout.partition()
	    .value(function(d) { return d.size; });
	//Arc Element
	var arc = d3.svg.arc()
	    .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x))); })
	    .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx))); })
	    .innerRadius(function(d) { return Math.max(0, y(d.y)); })
	    .outerRadius(function(d) { return Math.max(0, y(d.y + d.dy)); });



	//JASON!!
	d3.json('res/Coal.json',function(json){

		//Initial obj

		fullView(json);


		//Initial Pie
		var g = svg.selectAll("g")
			.data(partition.nodes(obj))
			.enter().append("g");
		//Appends the arc and colors. Adds onclick as well
		var path = g.append("path")
	    	.attr("d", arc)
	    	.style("fill", function(d) { return color((d.children ? d : d.parent).name); })
	    	.on("click", click);
		//Text Creation and Append
		var text = g.append("text")
			.attr("transform", function(d) { return "rotate(" + computeTextRotation(d) + ")"; })
			.attr("x", function(d) { return y(d.y); })
			.attr("dx", "6") // margin
			.attr("dy", ".35em") // vertical-align
			.text(function(d) { return d.name; });


		//Onclick
		function click(d) {

			// fade out all text elements
			text.transition().attr("opacity", 0);
			path.transition()
				.duration(750)
				.attrTween("d", arcTween(d))
				.each("end", function(e, i) {
					// check if the animated element's data e lies within the visible angle span given in d
					if (e.x >= d.x && e.x < (d.x + d.dx)) {
						// get a selection of the associated text element
						var arcText = d3.select(this.parentNode).select("text");
						// fade in the text element and recalculate positions
						arcText.transition().duration(750)
							.attr("opacity", 1)
							.attr("transform", function() {
								return "rotate(" + computeTextRotation(e) + ")";
							})
							.attr("x", function(d) {
								return y(d.y);
							});
					}
				});
		}
	});

	d3.select(self.frameElement).style("height", height + "px");



	//Obj Sequencing
	function makeHeirarchy(json, scope){
		switch (scope) {
			case 0:
				obj = {};
				obj = {name:"Cards", children:[]};
				valueChild(obj.children, json.Categories.Format);
				break;
			case 1:
				obj = {};
				obj = {name:"Cards", children:[]};
				completeChild(obj.children, json.Categories.Format);
				valueChild(obj.children[0].children, json.Categories.ExpansionStd);
				valueChild(obj.children[1].children, json.Categories.ExpansionWild);
				break;

		}
	}

	function fullView(json){
		obj = {name:"Cards", children:[]};
		completeChild(obj.children, json.Categories.Format);
		completeChild(obj.children[0].children, json.Categories.ExpansionStd);
		completeChild(obj.children[1].children, json.Categories.ExpansionWild);

		for (var j = 0; j < obj.children.length; j++) {
			for (var i = 0; i < obj.children[j].children.length; i++) {
				completeChild(obj.children[j].children[i].children, json.Categories.Class);

			}
		}
		for (var j = 0; j < obj.children.length; j++) {
			for (var i = 0; i < obj.children[j].children.length; i++) {
				for (var k = 0; k < obj.children[j].children[i].children.length; k++) {
					valueChild(obj.children[j].children[i].children[k].children, json.Categories.Type);
				}
			}
		}
		/*for (var j = 0; j < obj.children.length; j++) {
			for (var i = 0; i < obj.children[j].children.length; i++) {
				for (var k = 0; k < obj.children[j].children[i].children.length; k++) {
					for (var l = 0; l < obj.children[j].children[i].children[k].children.length; l++) {

						cardChild(obj.children[j].children[i].children[k].children[l].children, json.Cards,
							obj.children[j],
							obj.children[j].children[i],
							obj.children[j].children[i].children[k],
							obj.children[j].children[i].children[k].children[l]
						);
					}
				}
			}
		}*/

	}



	//Obj Assignments
	function completeChild(obj, array){
		for (var i = 0; i < array.length; i++) {
			obj[i] = {name:array[i], children:[]};
		}
	}

	function valueChild(obj, array){
		for (var i = 0; i < array.length; i++) {
			obj[i] = {name:array[i], children:[], size:1};
		}
	}

	function cardChild(obj, cards,format,expansion,classType,type){
		for (var i = 0; i < cards.length; i++) {
			console.log(cards[i].Format+" "+format);
			if (cards[i].Format==format&&
				cards[i].Expansion==expansion&&
				cards[i].Class==classType&&
				cards[i].Type==type) {
				obj[i] = {name:array[i], children:[], size:1};
				console.log("success");
			}
		}
	}



	//Tween and Text functions
	// Interpolate the scales!
	function arcTween(d) {
	  var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
		  yd = d3.interpolate(y.domain(), [d.y, 1]),
		  yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);
	  return function(d, i) {
		return i ? function(t) {
			return arc(d);
		} : function(t) {
			x.domain(xd(t));
			y.domain(yd(t)).range(yr(t));
			return arc(d);
		};
	  };
	}
	function computeTextRotation(d) {
		return (x(d.x + d.dx / 2) - Math.PI / 2) / Math.PI * 180;
	}
}());
