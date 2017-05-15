(function () {   'use strict';

//Member Variables
	//DOM
var View = document.getElementById('svgContainer');
var width = View.clientWidth;
var height = View.clientHeight;

	//Data
var coal;
var expansions;
var heirarchyobj;
var currentheirarchy = {};
var depth = 0;
var pathChoice = [];
	//Svg
var radius;
var x, y;
var color;
var svg;
var text;
var path;
var g;
//Partition Layout Element
var partition;
var arc;


//Function Stack
createCoal();
createSvg();


function createCoal(){
	//Importing json and assigning it to global values
	//I do this because any other command the global variable will dump the json data after the query for it is over
	//Using this ajax prevents that though
	$.ajax({
	        url: "res/Coal.json",
	        async: false,
	        dataType: 'json',
	        success: function(json) {
				coal = json;
	        }
	});
	$.ajax({
			url: "res/Expansions.json",
			async: false,
			dataType: 'json',
			success: function(json) {
				expansions = json;
			}
	});

	heirarchyobj = {name:"Cards", children:[]};
	//Assigns Format onto card object
	completeChild(heirarchyobj.children, coal.Categories.Format);
	//Assigns expansions onto standard
	completeChild(heirarchyobj.children[0].children, coal.Categories.ExpansionStd);
	//Assigns expansions onto wild
	completeChild(heirarchyobj.children[1].children, coal.Categories.ExpansionWild);
	//Assignment of populated expansion onto the pre existing model of empty expansions
	//Origionally i had nested for loops one deaper for every step in the heirarchy but this was to heavy from checking everything everytime
	//This more segmented less check heavy code works 10X faster
	heirarchyobj.children[0].children[0] = populateExpansion(expansions.Basic,coal);
	heirarchyobj.children[0].children[1] = populateExpansion(expansions.Classic,coal);
	//Changed my reference style because of spaces in the json keys, both above and below are the same command
	heirarchyobj.children[0].children[2] = populateExpansion(expansions["Whispers of the Old Gods"],coal);
	heirarchyobj.children[0].children[3] = populateExpansion(expansions["One Night in Karazhan"],coal);
	heirarchyobj.children[0].children[4] = populateExpansion(expansions["Mean Streets of Gadgetzan"],coal);
	heirarchyobj.children[0].children[5] = populateExpansion(expansions["Journey to UnGoro"],coal);
	heirarchyobj.children[1].children[0] = populateExpansion(expansions["Curse of Naxxramas"],coal);
	heirarchyobj.children[1].children[1] = populateExpansion(expansions["Goblins vs Gnomes"],coal);
	heirarchyobj.children[1].children[2] = populateExpansion(expansions["Blackrock Mountain"],coal);
	heirarchyobj.children[1].children[3] = populateExpansion(expansions["The Grand Tournament"],coal);
	heirarchyobj.children[1].children[4] = populateExpansion(expansions["League of Explorers"],coal);
	//Makes scope initially cards and format
	currentheirarchy = JSON.parse(JSON.stringify(heirarchyobj));
	for (var i = 0; i < currentheirarchy.children.length; i++) {
		currentheirarchy.children[i].size = 1;
		delete currentheirarchy.children[i].children;
	}

	//Function Specificly for card assignment
	function pickeyChild(obj, cards,classType,type){
		for (var i = 0; i < cards.length; i++) {
			if (cards[i].Class==classType.name&&
				cards[i].Type==type.name) {
				var currentcard = obj.length;
				obj[currentcard] = cards[i];
				obj[currentcard].size = 1;
			}
		}
	}

	//Used to assign everything else
	function completeChild(obj, array){
		for (var i = 0; i < array.length; i++) {
			obj[i] = {name:array[i], children:[]};
		}
	}

	//Takes expansion, populates it with the heirarchy and cards then returns it to be appended on the current heirarchy
	function populateExpansion(exp){
		var currentexpanse = {name:exp[0].Expansion, children:[]};
		//Assigns classes to the expansion
		completeChild(currentexpanse.children, coal.Categories.Class);
		for (var i = 0; i < coal.Categories.Class.length; i++) {
			//Assign type to the expansion classes
			completeChild(currentexpanse.children[i].children, coal.Categories.Type);
		}
		for (var k = 0; k < coal.Categories.Class.length; k++) {
			for (var j = 0; j < coal.Categories.Type.length;j++) {
				//Assign cards to expansion, classes, and types
				pickeyChild(currentexpanse.children[k].children[j].children, exp,currentexpanse.children[k], currentexpanse.children[k].children[j]);
			}
		}
		return currentexpanse;
	}
}



function createSvg(){
	partition = d3.layout.partition().value(function(d) { return d.size; });
	radius = Math.min(width, height) / 2-10;
	x = d3.scale.linear().range([0,2*Math.PI]);// 0 to circumfrence of a circle in radians
	y = d3.scale.linear().range([0,radius]);
	color = d3.scale.category20c();
			//Make the svg, attach it to the page, and center it.

	//Arc Element
	arc = d3.svg.arc()
	    .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x))); })
	    .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx))); })
	    .innerRadius(function(d) { return Math.max(0, y(d.y)); })
	    .outerRadius(function(d) { return Math.max(0, y(d.y + d.dy)); });
	//Initial Pie
	svg = d3.select("div").append("svg")
		.attr("width", width)
		.attr("height", height)
		.append("g")
		.attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")");
	g = svg.selectAll("g")
	    .data(partition.nodes(heirarchyobj))
		.enter().append("g");
	path = g.append("path")
		.attr("d", arc)
		.style("fill", function(d) { return color((d.children ? d : d.parent).name); })
		.on("click", click);
	text = g.append("text")
		.attr("transform", function(d) { return "rotate(" + computeTextRotation(d) + ")"; })
		.attr("x", function(d) { return y(d.y); })
		.attr("dx", "6") // margin
		.attr("dy", ".35em") // vertical-align
  		.text(function(d) {
			if (typeof d.name == 'undefined') {
				return d.Name;
			}else {
				return d.name;
			}
		});

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
                .attr("transform", function() { return "rotate(" + computeTextRotation(e) + ")"; })
                .attr("x", function(d) { return y(d.y); });
            }
        });
    }

}
d3.select(self.frameElement).style("height", height + "px");


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
