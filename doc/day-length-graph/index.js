var diary_loader = new DiaryLoader(
    (diary,source) => {

        // convert from your program's format to the Standard format:
        var diary_standard = diary.to("Standard");

        var cutoff = new Date().getTime() - 14*24*60*60*1000; // 14 days
        var summary = diary.to("Standard").summarise_days( r => r.start > cutoff );

        var bars = summary.durations
          .map( (height,n) => [height,'day ' + n] )
          .filter( r => r[0] ) // remove missing values
        ;

        var heights = bars.map( d => d[0] );
        var labels = bars.map( d => d[1] );

        // remove the "graph goes here" message:
        d3.selectAll("svg > *").remove()

        // initialise the <svg> element:
        var svg = d3.select("svg"),
            width = svg.attr("width") - 50,
            height = svg.attr("height") - 40,
            xScale = d3.scaleBand().range ([0, width]).padding(0.4),
            yScale = d3.scaleLinear().range ([height, 0]),
            g = svg.append("g")
              .attr("transform", "translate(49,15)")
        ;

        // define the size of the X and Y axes:
        xScale.domain(labels);
        yScale.domain([d3.min(heights) * 0.95, d3.max(heights) * 1.05]);

        // populate the graph:
        g.selectAll(".bar")
            .data(bars)
            .enter().append("rect")
            .attr("x", d => xScale(d[1]) )
            .attr("y", d => yScale(d[0]) )
            .attr("width", xScale.bandwidth())
            .attr("height", d => height - yScale(d[0]) )
            .style("fill", "steelblue")
        ;

        g.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(xScale))
        ;

        g.append("g")
            .call(d3.axisLeft(yScale).tickFormat(
                t => {
                    var hours   = Math.floor( t / (60*60*1000) ),
                        minutes = Math.floor( t /    (60*1000) ) % 60
                    ;
                    return hours + ( minutes < 10 ? ':0' : ':' ) + minutes;
                }).ticks(10))
            .append("text")
            .attr("y", 6)
            .attr("dy", "0.71em")
            .attr("text-anchor", "end")
            .text("value")
        ;

    },
    (raw,source) => {
        alert( "Could not load diary" );
    }
);

document.getElementById("diary-input")
    .addEventListener( "change", event => diary_loader.load(event) );
