class Linechart {
	constructor(_config, _data, _dispatcher) {
		this.config = {
			parentElement: _config.parentElement,
			containerWidth: _config.containerWidth || 500,
			containerHeight: _config.containerHeight || 250,
			margin: _config.margin || { top: 20, right: 45, bottom: 40, left: 45 },

			xTicks: _config.xTicks || 6,
			yTicks: _config.yTicks || 6,

			xLabel: _config.xLabel,
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
		vis.svg = d3.select(vis.config.parentElement).append('svg').attr('id', 'line-chart-main').attr('width', vis.config.containerWidth).attr('height', vis.config.containerHeight);

		// create the group
		vis.linechart = vis.svg.append('g').attr('class', 'main-group').attr('transform', `translate(${vis.config.margin.left}, ${vis.config.margin.top})`);

		// initialize scales
		vis.xScale = d3.scaleLinear().range([0, vis.width]);
		vis.yScale = d3.scaleLinear().range([0, vis.height]);
		vis.colorScale = d3.scaleOrdinal(d3.schemeCategory10);

		// initialize axes
		vis.xAxis = d3.axisBottom(vis.xScale).ticks(vis.config.xTicks).tickSize(-this.height).tickFormat(d3.format("d"));
		vis.yAxis = d3.axisLeft(vis.yScale).ticks(vis.config.yTicks).tickSize(-this.width);

		// create x and y axis groups
		vis.xAxisG = vis.linechart.append('g').attr('class', 'axis x-axis').attr('transform', `translate(0, ${vis.height})`);
		vis.yAxisG = vis.linechart.append('g').attr('class', 'axis y-axis');

		// marks for the lines and tracking area groups
		vis.marks = vis.linechart.append('g');
		vis.trackingArea = vis.linechart.append('rect')
			.attr('width', vis.width)
			.attr('height', vis.height)
			.attr('fill', 'none')
			.attr('pointer-events', 'all');

		// draw x axis label
		vis.linechart.append('text')
			.attr('class', 'axis-label')
			.attr('text-anchor', 'middle')
			.attr('x', vis.width / 2)
			.attr('y', vis.height + 35)
			.text(vis.config.xLabel)

		// initialize selected structure
		vis.selected = {
			item: 'ratings',
			type: null,
			values: [],
		};
	}

	updateVis() {
		const vis = this;

		vis.lines = {};
		let minYear = -1;
		let maxYear = -1;
		let maxGames = 0;
		for (const val of vis.selected.values) {
			vis.lines[val] = {};
			for (const game of vis.data) {
				if (game[vis.selected.type].includes(val)) {
					const year = game.released.getFullYear();

					if (vis.selected.item === 'ratings') {
						vis.lines[val][year] = vis.lines[val][year] || [];
						vis.lines[val][year].push(game.rating);
					} else {
						if (vis.lines[val][year]) {
							vis.lines[val][year]++;
							if (vis.lines[val][year] > maxGames) {
								maxGames = vis.lines[val][year];
							}
						} else {
							vis.lines[val][year] = 1;
						}
					}

					if (year < minYear || minYear === -1) {
						minYear = year;
					}

					if (year > maxYear || maxYear === -1) {
						maxYear = year;
					}
				}
			}

			if (vis.selected.item === 'ratings') {
				for (const year in vis.lines[val]) {
					vis.lines[val][year] = d3.mean(vis.lines[val][year]);
				}
			}

			vis.lines[val] = Object.entries(vis.lines[val]);
		}

		vis.lines = Object.entries(vis.lines);

		// set scale domains
		vis.xScale.domain([minYear, maxYear]);
		if (vis.selected.item === 'ratings') {
			vis.yScale.domain([5, 0]);
		} else {
			vis.yScale.domain([maxGames, 0]);
		}

		// draw Y axis label (depends on the selections)
		d3.select('#line-y-axis-label').remove()
		vis.linechart.append('text')
			.attr('class', 'axis-label')
			.attr('id', 'line-y-axis-label')
			.attr('text-anchor', 'middle')
			.attr('transform', 'rotate(-90)')
			.attr('y', -30)
			.attr('x', -vis.height / 2)
			.text(vis.selected.item.charAt(0).toUpperCase() + vis.selected.item.slice(1)) // capitalize first letter

		// create line constructor
		vis.line = d3.line()
			.curve(d3.curveMonotoneX)
			.x(d => vis.xScale(+d[0]))
			.y(d => vis.yScale(d[1]));

		// render
		vis.renderVis();
	}

	renderVis() {
		const vis = this;

		vis.marks.selectAll('.linechart-line')
			.data(vis.lines)
			.join('path')
			.attr('class', 'linechart-line')
			.attr('fill', 'none')
			.attr('stroke', (_, i) => vis.colorScale(i))
			.attr('stroke-width', '5px')
			.attr('d', d => vis.line(d[1]));

		// tooltips
		vis.trackingArea.on('mouseleave', () => {
			d3.select('#tooltip').style('display', 'none');
			vis.marks.selectAll('#year-indicator').style('display', 'none');
		});

		vis.trackingArea.on('mousemove', function (event) {
			// Get date that corresponds to current mouse x-coordinate
			const xPos = d3.pointer(event, this)[0]; // First array element is x, second is y
			const year = Math.round(vis.xScale.invert(xPos));

			if (year != -1) { // non strict
				// white line that indicates year
				vis.marks.selectAll('#year-indicator')
					.data([year])
					.join('line')
					.attr('id', 'year-indicator')
					.attr('stroke', 'white')
					.attr('stroke-width', '2px')
					.attr('x1', vis.xScale)
					.attr('x2', vis.xScale)
					.attr('y1', vis.yScale(vis.yScale.domain()[0]))
					.attr('y2', vis.yScale(vis.yScale.domain()[1]))
				vis.marks.selectAll('#year-indicator').style('display', 'block');

				// actual tooltip
				d3.select('#tooltip')
					.style('display', 'block')
					.style('left', (event.pageX + 15) + 'px')
					.style('top', (event.pageY + 15) + 'px')
					.html(`
						<p class="tooltip-title">${vis.selected.item.charAt(0).toUpperCase() + vis.selected.item.slice(1)} for ${year}</p>
					`);

				// legend on the tooltip
				for (let i = 0; i < vis.lines.length; i++) {
					const entry = vis.lines[i];
					let found = false;
					for (const entryYear of entry[1]) {
						if (entryYear[0] == year) { // non strict
							$('#tooltip').append(`
								<p>
									<svg fill="${vis.colorScale(i)}" class="tooltip-circle" width="12" height="12"><circle cx="6" cy="6" r="5"></circle></svg>
									<span class='tooltip-bold'>${entry[0]}</span> ${+entryYear[1].toFixed(2)}
								</p>
							`);
							found = true;
							break;
						}
					}

					// DEFAULTS to N/A
					if (!found) $('#tooltip').append(`
						<p>
							<svg fill="${vis.colorScale(i)}" class="tooltip-circle" width="12" height="12"><circle cx="6" cy="6" r="5"></circle></svg>
							<span class='tooltip-bold'>${entry[0]}</span> N/A
						</p>
					`);
				}
			}
		});

		// draw axis and labels
		vis.xAxisG.call(vis.xAxis);
		vis.yAxisG.call(vis.yAxis);
	}
}
