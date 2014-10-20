var pymChild = null,
    mobileThreshold = 300, //set to 500 for testing
    aspect_width = 16,
    aspect_height = 9;

//standard margins
var margin = {
    top: 0,
    right: 25,
    bottom: 20,
    left: 130
};

//data 
var data = [{"tech":"Coal fire power plant","carbon":2000, "tooltip":"2,000"},
{"tech":"Natural gas power plant","carbon":1000, "tooltip": "1,000-1,100"},
{"tech":"Bloom (Advertised Number)","carbon":773, "tooltip":"773"},
{"tech":"Solar","carbon":100, "tooltip":"Less than 100"},
{"tech":"Wind","carbon":100, "tooltip":"Less than 100"}];


//jquery shorthand
var $graphic = $('#graphic');
//base colors
var colors = {
    'red1': '#6C2315', 'red2': '#A23520', 'red3': '#D8472B', 'red4': '#E27560', 'red5': '#ECA395', 'red6': '#F5D1CA',
    'orange1': '#714616', 'orange2': '#AA6A21', 'orange3': '#E38D2C', 'orange4': '#EAAA61', 'orange5': '#F1C696', 'orange6': '#F8E2CA',
    'yellow1': '#77631B', 'yellow2': '#B39429', 'yellow3': '#EFC637', 'yellow4': '#F3D469', 'yellow5': '#F7E39B', 'yellow6': '#FBF1CD',
    'teal1': '#0B403F', 'teal2': '#11605E', 'teal3': '#17807E', 'teal4': '#51A09E', 'teal5': '#8BC0BF', 'teal6': '#C5DFDF',
    'blue1': '#28556F', 'blue2': '#3D7FA6', 'blue3': '#51AADE', 'blue4': '#7DBFE6', 'blue5': '#A8D5EF', 'blue6': '#D3EAF7'
};

/*
 * Render the graphic
 */
//check for svg
$(window).load(function() {
    draw_graphic();
});

function draw_graphic(){
    if (Modernizr.svg){
        $graphic.empty();
        var width = $graphic.width();
        render(width);
        window.onresize = draw_graphic; //very important! the key to responsiveness
    }
}

function render(w) {

    var mobile = {};
    //check for mobile and change everything
    function ifMobile (w) {
        if(w < mobileThreshold){
            margin.left = 85;
            mobile.spacer = 0.25;
            mobile.axis = -11;
            mobile.format = d3.format(",f");
        }
        else{
            margin.left = 130;
            mobile.spacer = 0.15;
            mobile.axis = 0;
            mobile.format = d3.format(",f");
        }
    }

    ifMobile(w);


    var width = w - margin.left - margin.right,
        height = Math.ceil((width * aspect_height) / aspect_width) - margin.top - margin.bottom;


    var x = d3.scale.linear().range([0, width]),
        y = d3.scale.ordinal().rangeRoundBands([0, height], mobile.spacer);

    var xAxis = d3.svg.axis()
        .scale(x)
        .ticks(5)
        .tickFormat(mobile.format)
        .orient("bottom")
        .tickSize(0);

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

    var svg = d3.select("#graphic").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    //tooltip
    var div = d3.select("#graphic").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
    
    //gridlines
    var make_x_axis = function() { 
        return d3.svg.axis()
                .scale(x)
                .orient("bottom")
                .ticks(5)
                 }

    //data stuff
        x.domain([0, d3.max(data, function(d) { return d.carbon + 100; })]);
        y.domain(data.map(function(d) { return d.tech; }));

        //color pallete
        var barColor = d3.scale.ordinal()
            //.domain(x.domain)
            .range([colors.red1, colors.orange2, colors.yellow2, colors.teal2, colors.blue2]);

        //grid
        svg.append("g")
            .attr("class", "grid")
            .attr("transform", "translate(0," + height + ")")
            .call(make_x_axis()
                .tickSize((-height + 10),0,0)
                .tickFormat("")
            )

        //bar
        svg.selectAll(".bar")
              .data(data)
            .enter().append("rect")
                .attr("class", "bar")
                .attr("x", 5)
                .attr("fill", function(d, i) { return barColor(i); })
                .attr("width", function(d){ return x(d.carbon
                    ); })
                .attr("y", function(d){ return y(d.tech); })
                .attr("height", y.rangeBand())
                .on("mouseover", function(d) {
                    div.transition()
                        .duration(200)
                        .style("opacity", 0.9);
                    div.html(d.tooltip + " lbs")
                        .style("left", (d3.event.pageX) + "px")
                        .style("top", (d3.event.pageY - 28) + "px");
                    })
                .on("mouseout", function(d) {
                    div.transition()
                        .duration(500)
                        .style("opacity", 0);
                });

        //y axis labels
        svg.append("g")
            .attr("transform", "translate(-3," + mobile.axis + ")")
            .attr("class", "y axis")
            .call(yAxis)
                .attr("text-anchor", "end")
            .selectAll(".tick text")
                .call(wrap, margin.left); //call word wrapping function

        //call x axis (delete for a very spare effecrt)
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

    //end data stuff


    //textwrapper
    function wrap(text, width) {
      text.each(function() {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            y = text.attr("y"),
            dy = parseFloat(text.attr("dy")),
            tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
        while (word = words.pop()) {
          line.push(word);
          tspan.text(line.join(" "));
          if (tspan.node().getComputedTextLength() > width) {
            line.pop();
            tspan.text(line.join(" "));
            line = [word];
            tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);}
            }
    });
    }

//end function render    
}






