(function () {   'use strict';

//Member Variables
	//DOM
var View = document.getElementById('svgContainer');
var cardView = document.getElementById('displayContainer');
var backButton = document.getElementById('back');
backButton.addEventListener("click", exitDisplay);
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
var partition = d3.layout.partition().value(function(d) { return d.size; });
var arc;
var lastcolor;

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

	Setup(currentheirarchy);

	function Setup(data){
		d3.select("svg").remove();
		svg = d3.select("div").append("svg")
			.attr("width", width)
			.attr("height", height)
			.append("g")
			.attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")");
		var g = svg.selectAll("g")
			.data(partition.nodes(data))
			.enter().append("g");
		//Appends the arc and colors. Adds onclick as well
		path = g.append("path")
			.attr("d", arc)
			.style("fill", function(d) { return findColor(d); })
			.on("click", click);

		//Text Creation and Append
		text = g.append("text")
			.attr("transform", function(d) { return "rotate(" + computeTextRotation(d) + ")"; })
			.attr("x", function(d) { return y(d.y); })
			.attr("dx", "6") // margin
			.attr("dy", ".35em") // vertical-align
			.text(function(d) {
				if(d.depth === 0 && d.name === "Cards"){
					return "";
				}else if(d.name === "Wild") {
					return "";
				}else if(d.name === "Standard") {
					return "";
				}else if(d.name === "Neutral") {
					return "";
				}else if(d.name === "Druid") {
					return "";
				}else if(d.name === "Hunter") {
					return "";
				}else if(d.name === "Mage") {
					return "";
				}else if(d.name === "Paladin") {
					return "";
				}else if(d.name === "Priest") {
					return "";
				}else if(d.name === "Rogue") {
					return "";
				}else if(d.name === "Shaman") {
					return "";
				}else if(d.name === "Warlock") {
					return "";
				}else if(d.name === "Warrior") {
					return "";
				}else if(d.depth === 0) {
					return "";
				}else {
					if (typeof d.name == 'undefined') {
						return d.Name;
					}else {
						return d.name;
					}
				}
			});
		var imgx;
		var imgy;
		var angle;
		var distance;
		var initialangle = 0;
		img = g.append("image")
			.attr("xlink:href", function(d) {
				if(d.depth === 0 && d.name === "Cards"){
					return "res/PNG/Logo_alone.png";
				}else if(d.name === "Wild") {
					return "res/icon/Wild.png";
				}else if(d.name === "Standard") {
					return "res/icon/Standard.png";
				}else if(d.name === "Neutral") {
					return "res/icon/Neutral.png";
				}else if(d.name === "Druid") {
					return "res/icon/Druid.png";
				}else if(d.name === "Hunter") {
					return "res/icon/Hunter.png";
				}else if(d.name === "Mage") {
					return "res/icon/Mage.png";
				}else if(d.name === "Paladin") {
					return "res/icon/Palidin.png";
				}else if(d.name === "Priest") {
					return "res/icon/Priest.png";
				}else if(d.name === "Rogue") {
					return "res/icon/Rogue.png";
				}else if(d.name === "Shaman") {
					return "res/icon/Shaman.png";
				}else if(d.name === "Warlock") {
					return "res/icon/Warlock.png";
				}else if(d.name === "Warrior") {
					return "res/icon/Warrior.png";
				}else if(d.depth === 0) {
					return "res/PNG/logo_tran.png";
				}else {
					return "res/icon/"+d.name+".png";
				}
			})
			.attr("width", function(d){
				if (d.y === 0) {
					return (d.dy+d.dy)*radius+2;//g.width+2
				}else{
					return Math.abs(d.y-(d.dy+d.dy))*radius-60;
				}
			})
			.attr("height",function(d){
				if (d.y === 0) {
					return (d.dy+d.dy)*radius+2;
				}else{
					return Math.abs(d.y-(d.dy+d.dy))*radius-60;
				}
			})
			.attr("x", function(d){
				if (d.y === 0) {
					imgx = -d.dy;
					return imgx*radius-1;
				}else{

					angle = ((d.dx/2)+d.x)*2*Math.PI;
					console.log((360*angle)/(2*Math.PI));
					distance = ((d.dy/2)+d.y)*radius;
					console.log(distance);
					imgx = distance*Math.sin(angle);
					return imgx -(d.dy/2)*radius+30;

				}
			})
			.attr("y",function(d){
				if (d.y === 0) {
					imgy = -d.dy;
					return imgy*radius-1;
				}else{
					angle = ((d.dx/2)+d.x)*2*Math.PI;
					distance = ((d.dy/2)+d.y)*radius;
					imgy = distance*Math.cos(angle);
					return -imgy-(d.dy/2)*radius+30;

				}
			})
			.on("click", click);

	}

	//Onclick
	function click(d) {
		// fade out all text elements
		d = adjustScope(d);
		Setup(d);
	}
}
function nothing(){

}


function cardInspect(card){
	cardView.style.display = "inline";
	if (typeof card.Pic == 'undefined') {
		console.log(card.Pic);
		document.getElementById("card").src = "res/cardback_0.png";
	}else {
		console.log();
		document.getElementById("card").src = "res/Cardpng/"+card.Pic;
	}

	document.getElementById("name").innerHTML = card.Name;
	document.getElementById("description").innerHTML = card.Description;
	document.getElementById("expansion").innerHTML = card.Expansion;
	document.getElementById("race").innerHTML = card.Race;

}

function exitDisplay(){
	cardView.style.display = "none";
}

function adjustScope(objClicked){
	var i;
	//Temp obj to get our heirarchy reformated
	var hotObj = jQuery.extend(true, {}, heirarchyobj);
	//changes our depth pointer and if going deeper it stores the path in our last depth
	if (0 < objClicked.depth) {
		if (depth <4) {
			depth+=1;
			for (i = 0; i < objClicked.parent.children.length; i++) {
				// this is were we make our path at whatever our last depth was
				if (objClicked.name == objClicked.parent.children[i].name) {
					pathChoice[depth-1]=i;
				}
			}
			//card popout
		}else {
			cardInspect(objClicked);
		}
	}else if (1 > objClicked.depth) {
		if (depth!==0) {
			depth-=1;
		}
	}
	//Loops until current depth to get us the right children. nothing worse than getting home and finding a different persons baby in your car
	for (i = 0; i < depth; i++) {
		hotObj = hotObj.children[pathChoice[i]];
	}
	//deletes all those pesky grandkids, dont want them loitering and taking space on the pie
	for (i = 0; i < hotObj.children.length; i++) {

		hotObj.children[i].size = 1;
		hotObj.children[i].children = [];
	}
	//sets the parents because i guess respect your elders or something
	hotObj.parent = objClicked.parent;
	currentheirarchy = hotObj;
	return hotObj;
}



function computeTextRotation(d) {
	return (x(d.x + d.dx / 2) - Math.PI / 2) / Math.PI * 180;
}

function findColor(obj){
	var name = obj.name;
	switch (name) {
		case "Cards":
			return "#fff";

		case "Standard":
			return "#fa0";
		case "Basic":
			return "#9b7b43";
		case "Classic":
			return "#6d4519";
		case "Whispers of the Old Gods":
			return "#763bac";
		case "One Night in Karazhan":
			return "#ce5ae2";
		case "Mean Streets of Gadgetzan":
			return "#4a41c9";
		case "Journey to Un'Goro":
			return "#9b9a97";

		case "Wild":
			return "#705d50";
		case "Curse of Naxxramas":
			return "#1568cc";
		case "Goblins vs Gnomes":
			return "#547f46";
		case "Blackrock Mountain":
			return "#efb126";
		case "The Grand Tournament":
			return "#e54141";
		case "League of Explorers":
			return "#ffee1a";

		case "Neutral":
			return "#c1c1c1";
		case "Warlock":
			return "#601966";
		case "Warrior":
			return "#A51c1c";
		case "Shaman":
			return "#0d2068";
		case "Hunter":
			return "#285611";
		case "Druid":
			return "#724b11";
		case "Paladin":
			return "#fcdc22";
		case "Mage":
			return "#1568cc";
		case "Rogue":
			return "#2d2d2d";
		case "Priest":
			return "#fcda70";
		default:
			switch (obj.parent.name) {
				case "Neutral":
					lastcolor ="#c1c1c1";
					return "#c1c1c1";
				case "Warlock":
					if (name == "Minion") {
						lastcolor ="#7c2d7f";
						return "#7c2d7f";
					}else if (name == "Spell") {
						lastcolor ="#bb6bc1";
						return "#bb6bc1";
					}else{
						lastcolor ="#d782e0";
						return "#d782e0";
					}
					break;
				case "Warrior":
					if (name == "Minion") {
						lastcolor ="#af3333";
						return "#af3333";
					}else if (name == "Spell") {
						lastcolor ="#c14040";
						return "#c14040";
					}else{
						lastcolor ="#e26060";
						return "#e26060";
					}
					break;
				case "Shaman":
					if (name == "Minion") {
						lastcolor ="#162b91";
						return "#162b91";
					}else if (name == "Spell") {
						lastcolor ="#2843a5";
						return "#2843a5";
					}else{
						lastcolor ="#4c6abf";
						return "#4c6abf";
					}
					break;
				case "Hunter":
					if (name == "Minion") {
						lastcolor ="#427f1f";
						return "#427f1f";
					}else if (name == "Spell") {
						lastcolor ="#65ad36";
						return "#65ad36";
					}else{
						lastcolor ="#87ce59";
						return "#87ce59";
					}
					break;
				case "Druid":
					if (name == "Minion") {
						lastcolor ="#8c622a";
						return "#8c622a";
					}else if (name == "Spell") {
						lastcolor ="#a57e50";
						return "#a57e50";
					}else{
						lastcolor ="#ba9979";
						return "#ba9979";
					}
					break;
				case "Paladin":
					if (name == "Minion") {
						lastcolor ="#ffe255";
						return "#ffe255";
					}else if (name == "Spell") {
						lastcolor ="#ffe578";
						return "#ffe578";
					}else{
						lastcolor ="#ffea94";
						return "#ffea94";
					}
					break;
				case "Mage":
					if (name == "Minion") {
						lastcolor ="#3d80b7";
						return "#3d80b7";
					}else if (name == "Spell") {
						lastcolor ="#5c95bc";
						return "#5c95bc";
					}else{
						lastcolor ="#75abc9";
						return "#75abc9";
					}
					break;
				case "Rogue":
					if (name == "Minion") {
						lastcolor ="#3f3f3f";
						return "#3f3f3f";
					}else if (name == "Spell") {
						lastcolor ="#515151";
						return "#515151";
					}else{
						lastcolor ="#666";
						return "#666";
					}
					break;
				case "Priest":
					if (name == "Minion") {
						lastcolor ="#ffe497";
						return "#ffe497";
					}else if (name == "Spell") {
						lastcolor ="#ffebb8";
						return "#ffebb8";
					}else{
						lastcolor ="#fcebc5";
						return "#fcebc5";
					}
					break;
				default:
					return lastcolor;
			}
			return "#fcda70";
		}
	}
}());
