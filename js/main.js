const toSplit = ['platforms', 'developers', 'genres', 'publishers'];
const numerical = ['id', 'metacritic', 'rating', 'playtime', 'achievements_count', 'ratings_count', 'suggestions_count', 'reviews_count'];

let data = null;
let selectOptions = {
	publishers: new Map(),
	platforms: new Map(),
};

let linechart, heatmap, innovative, barchart, scatterplot;
let dispatcher;

d3.csv('data/game_info_processed.csv').then(_data => {
	// convert to numerical and split multivalued columns
	_data.forEach(d => {
		Object.keys(d).forEach(attr => {
			if (toSplit.includes(attr)) {
				d[attr] = d[attr].split('||');
			} else if (numerical.includes(attr)) {
				d[attr] = +d[attr];
			} else if (attr === 'released') {
				d[attr] = new Date(d[attr]);
			}
		});

		// create publisher and platform options
		Object.keys(selectOptions).forEach(type => {
			for (const member of d[type]) {
				const current = selectOptions[type].get(member);
				if (!current) {
					selectOptions[type].set(member, 1);
				} else {
					selectOptions[type].set(member, current + 1);
				}
			}
		});
	});

	_data.sort((a, b) => a.id - b.id);
	data = _data;

	// create publisher and platform options
	for (const type of Object.keys(selectOptions)) {
		const keys = [...selectOptions[type].keys()];
		keys.sort();

		// create options
		for (const option of keys) {
			// only show publishers with more than one game (it is a LINE chart afterall)
			if (selectOptions[type].get(option) > 1) {
				$(`#linechart-selection-${type}`).append($('<option></option>').text(option).val(option));
			}
		}
	}

	// remove loading screen
	$('.loading').hide(0);
	$('.container').show(0);

	// create dispatcher
	dispatcher = d3.dispatch('setActivePublishers');

	// linechart
	linechart = new Linechart({
		parentElement: '#line-chart-area',
		containerWidth: 800,
		containerHeight: 500,

		xLabel: 'Year',
	}, data, dispatcher);

	linechart.updateVis();

	// heatmap
	heatmap = new Heatmap({
		parentElement: '#heatmap',
		containerWidth: 950,
		containerHeight: 500,
	}, data, dispatcher);

	heatmap.updateVis();

	// innovative view
	innovative = new Innovative({
		parentElement: '#innovative-view'
	}, data, "genres", 2020);

	innovative.updateVis();

	// barchart
	barchart = new BarChart({
		parentElement: '#bar-chart'
	}, data);

	barchart.updateVis();

	// scatterplot
	scatterplot = new Scatterplot({
		parentElement: '#scatterplot',
		containerWidth: 500,
		containerHeight: 300,
		fillColor: '#42c5e9',
		fillOpacity: 0.5,

		xLabel: 'Rating',
		yLabel: 'Number of games',
	}, data, dispatcher);

	scatterplot.updateVis();

	// dispatcher
	dispatcher.on('setActivePublishers', (publisher, active) => {
		if (publisher instanceof Array) {
			// passed in array, so all of these publishers should be active and no others
			scatterplot.activePublishers = new Map(publisher.map(a => [a, true]));
			barchart.publisherFilter = new Map(publisher.map(a => [a, true]));
		} else if (active) {
			scatterplot.activePublishers.set(publisher, active);
			barchart.publisherFilter.set(publisher, active);
		} else {
			scatterplot.activePublishers.delete(publisher);
			barchart.publisherFilter.delete(publisher);
		}

		scatterplot.renderVis();
		barchart.updateVis();

		$(`#linechart-selection-publishers option[value="${publisher}"]`).prop('selected', active);

		// hide platforms, show publishers
		$('#select-publishers').prop('checked', true);
		$('.linechart-selection').hide(0);
		$(`#linechart-selection-publishers`).show(0);

		updateLinechartSelection();
	});
});

// onchange for heatmap x label
d3.select('#heatmap-x').on('change', function () {
	let selectedX = d3.select(this).property('value');
	heatmap.selectedX = selectedX;
	d3.select("#heatmap").selectAll("g").remove();
	heatmap.updateVis();
});

// onchange for heatmap y label
d3.select('#heatmap-y').on('change', function () {
	let selectedY = d3.select(this).property('value');
	heatmap.selectedY = selectedY;
	d3.select("#heatmap").selectAll("g").remove();
	heatmap.updateVis();
});

d3.select('#year-selector').on('change', function () {
	innovative.selectedYear = d3.select(this).property('value');
	innovative.updateVis();
});

d3.select('#attr-filter-selector').on('change', function () {
	innovative.selectedAttr = d3.select(this).property('value');
	innovative.updateVis();
});

$('.linechart-type, .linechart-item').on('click', function () {
	const type = $('.linechart-type:checked').val();
	updateLinechartSelection();

	$('.linechart-selection').hide(0);
	$(`#linechart-selection-${type}`).show(0);
});

$('.linechart-selection').on('change', function () {
	const type = $('.linechart-type:checked').val();
	if (type === 'publishers') {
		dispatcher.call('setActivePublishers', null, $(this).val());
	}

	updateLinechartSelection();
});

function updateLinechartSelection() {
	const type = $('.linechart-type:checked').val();
	const item = $('.linechart-item:checked').val();
	linechart.selected = {
		item: item,
		type: type,
		values: $(`#linechart-selection-${type}`).val() || [],
	};

	linechart.updateVis();
}
