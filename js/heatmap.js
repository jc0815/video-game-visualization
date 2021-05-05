class Heatmap {

  constructor(_config, _data, _dispatcher) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 500,
      containerHeight: _config.containerHeight || 140,
      margin: _config.margin || {top: 30, right: 5, bottom: 50, left: 65}
    }

    this.dispatcher = _dispatcher;
    let queryX = document.querySelector('#heatmap-x option:checked').value; // get jquery x var
    let queryY = document.querySelector('#heatmap-y option:checked').value; // get jquery y var
    // filter out zero entries from data
    var filteredData = _data.filter(function(d, i) {
      if (d[queryY] > 0 && d[queryX] > 0) {
        return d;
      }
    });
    this.data = filteredData;
    this.selectedX = queryX;
    this.selectedY = queryY;

    this.initVis();
  }

  initVis() {
    let vis = this;

    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    // set up chart area
    vis.svg = d3.select(vis.config.parentElement)
                .append('svg')
                  .attr('id', 'heatmap-main')
                  .attr('width', vis.config.containerWidth)
                  .attr('height', vis.config.containerHeight);

  }

  updateVis() {
    let vis = this;

    // set up heatmap
    vis.heatmap = vis.svg.append('g')
                      .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

    // draw axis labels
		vis.heatmap.append("text") // x label
      .attr("class", "axis-label")
      .attr("text-anchor", "end")
      .attr("x", vis.width/2)
      .attr("y", vis.height + 35)
      .text(this.capitalize(vis.selectedX));
    vis.heatmap.append("text") // y label
      .attr("class", "axis-label")
      .attr("text-anchor", "end")
      .attr("x", -vis.height / 2 + 30)
      .attr("y", -60)
      .attr("dy", ".75em")
      .attr("transform", "rotate(-90)")
      .text(this.capitalize(vis.selectedY));

    // set up x and y scales
    vis.yScale = d3.scaleLinear()
                  .domain(d3.extent(vis.data, d => d[vis.selectedY]))
                  .range([ vis.height, 0]);
    vis.xScale = d3.scaleLinear()
                  .domain(d3.extent(vis.data, d => d[vis.selectedX]))
                  .range([ 0, vis.width ]);

    // set up x and y axis
    vis.yAxis = d3.axisLeft(vis.yScale);
    vis.xAxis = d3.axisBottom(vis.xScale);

    // set up x and y axis groups
    vis.xAxisG = vis.heatmap.append('g')
                  .attr('class', 'axis x-axis')
                  .attr("transform", "translate(0," + vis.height + ")");
    vis.yAxisG = vis.heatmap.append('g')
                  .attr('class', 'axis y-axis');

    // update x and y values
    vis.yValue = d => d[vis.selectedY];
    vis.xValue = d => d[vis.selectedX];

    vis.renderVis();
  }

  renderVis() {
    let vis = this;

    // color scheme for heatmap
    var color = d3.scaleLinear()
                .domain([0, 600])
                .range(["transparent",  "#42c5e9"])

    // reference to: https://www.d3-graph-gallery.com/graph/density2d_hexbin.html
    var inputHexbin = []; // initialize hexbins
    // make a hexbin for each pair of entry
    vis.data.forEach(function(d) {
      inputHexbin.push( [vis.xScale(d[vis.selectedX]), vis.yScale(d[vis.selectedY])] )
    });

    // compute hexbin data
    var hexbin = d3.hexbin()
                  .radius(20) // size of the bin in px
                  .extent([ [0, 0], [vis.width, vis.height] ])

    // plot the hexbins
    vis.heatmap.append("clipPath")
        .attr("id", "clip")
      .append("rect")
        .attr("width", vis.width)
        .attr("height", vis.height)

    vis.heatmap.append("g")
      .attr("clip-path", "url(#clip)")
      .selectAll("path")
      .data( hexbin(inputHexbin) )
      .enter().append("path")
        .attr("d", hexbin.hexagon())
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
        .attr("fill", function(d) { return color(d.length); })
        .attr("stroke", "black")
        .attr("stroke-width", "0.1")

    vis.xAxisG.call(vis.xAxis); // draw x axis
		vis.yAxisG.call(vis.yAxis); // draw y axis
  }

  // helper to capitalize first letter
  capitalize(str) {
      return str[0].toUpperCase() + str.slice(1);
  }
}
