class Scatterplot {
	constructor(_config, _data, _dispatcher) {
		this.config = {
			parentElement: _config.parentElement,
			containerWidth: _config.containerWidth || 500,
			containerHeight: _config.containerHeight || 250,
			margin: _config.margin || { top: 10, right: 15, bottom: 40, left: 35 },

			xTicks: _config.xTicks || 6,
			yTicks: _config.yTicks || 6,
			circleRadius: _config.circleRadius || '5px',
			fillColor: _config.fillColor || 'black',
			fillOpacity: _config.fillOpacity || 1.0,

			xLabel: _config.xLabel,
			yLabel: _config.yLabel,
		}

		this.data = _data;
		this.dispatcher = _dispatcher;

		this.initVis();
	}

	initVis() {
		const vis = this;

		// calculate inner chart size
		vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
		vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

		// create the svg, setting its width and height
		vis.svg = d3.select(vis.config.parentElement).append('svg').attr('id', 'scatterplot-main').attr('width', vis.config.containerWidth).attr('height', vis.config.containerHeight);

		// create the group
		vis.scatterplot = vis.svg.append('g').attr('class', 'main-group').attr('transform', `translate(${vis.config.margin.left}, ${vis.config.margin.top})`);

		// initialize scales
		vis.xScale = d3.scaleLinear().range([0, vis.width]);
		vis.yScale = d3.scaleLinear().range([0, vis.height]);

		// initialize axes
		vis.xAxis = d3.axisBottom(vis.xScale).ticks(vis.config.xTicks).tickSize(-this.height);
		vis.yAxis = d3.axisLeft(vis.yScale).ticks(vis.config.yTicks).tickSize(-this.width);

		// create x and y axis groups
		vis.xAxisG = vis.scatterplot.append('g').attr('class', 'axis x-axis').attr('transform', `translate(0, ${vis.height})`);
		vis.yAxisG = vis.scatterplot.append('g').attr('class', 'axis y-axis');

		// draw axis labels
		vis.scatterplot.append('text')
			.attr('class', 'axis-label')
			.attr('text-anchor', 'middle')
			.attr('x', vis.width / 2)
			.attr('y', vis.height + 35)
			.text(vis.config.yLabel)

		vis.scatterplot.append('text')
			.attr('class', 'axis-label')
			.attr('text-anchor', 'middle')
			.attr('transform', 'rotate(-90)')
			.attr('y', -20)
			.attr('x', -vis.height / 2)
			.text(vis.config.xLabel)

		// map that handles which publishers are active
		this.activePublishers = new Map();
	}

	updateVis() {
		const vis = this;

		vis.publishers = {};
		for (const game of vis.data) {
			for (const publisher of game.publishers) {
				vis.publishers[publisher] = vis.publishers[publisher] || { ratings: [], gameCount: 0 };

				vis.publishers[publisher].gameCount++;
				vis.publishers[publisher].ratings.push(game.rating);
			}
		}

		let maxGames = 0;
		for (const publisher of Object.keys(vis.publishers)) {
			if (vis.publishers[publisher].gameCount > maxGames) {
				maxGames = vis.publishers[publisher].gameCount;
			}

			vis.publishers[publisher] = [d3.mean(vis.publishers[publisher].ratings), vis.publishers[publisher].gameCount];
		}

		vis.publishers = Object.entries(vis.publishers).filter(d => d[1][1] > 10); // TODO decide threshold

		// set scale domains
		vis.xScale.domain([0, maxGames]);
		vis.yScale.domain([5, 0]);

		// render
		vis.renderVis();
	}

	renderVis() {
		const vis = this;

		// plot data (circles)
		const points = vis.scatterplot.selectAll('.point')
			.data(vis.publishers)
			.join('circle')
			.attr('class', d => {
				if (this.activePublishers.get(d[0])) {
					return 'point active';
				}

				return 'point';
			})
			.attr('r', vis.config.circleRadius)
			.attr('cy', d => vis.yScale(d[1][0]))
			.attr('cx', d => vis.xScale(d[1][1]))
			.attr('fill', vis.config.fillColor)
			.attr('opacity', vis.config.fillOpacity);

		// tooltips
		points.on('mouseover', (event, d) => {
			d3.select('#tooltip')
				.style('display', 'block')
				.style('left', (event.pageX + 15) + 'px')
				.style('top', (event.pageY + 15) + 'px')
				.html(`
					<p class="tooltip-title">${d[0]}</p>
					<p><span class='tooltip-bold'>Number of games:</span> ${d[1][1]}</p>
					<p><span class='tooltip-bold'>Average Rating:</span> ${d[1][0].toFixed(2)}</p>
				`);
		});

		points.on('mouseleave', () => {
			d3.select('#tooltip').style('display', 'none');
		});

		// events for when the user clicks, update other visualizations
		points.on('click', function (event, d) {
			// toggle active
			const isActive = d3.select(this).classed('active');
			vis.dispatcher.call('setActivePublishers', event, d[0], !isActive);
		});

		// draw axis and labels
		vis.xAxisG.call(vis.xAxis);
		vis.yAxisG.call(vis.yAxis);
	}
}
