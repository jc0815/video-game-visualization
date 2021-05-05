class BarChart {

    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 500,
            containerHeight: _config.containerHeight || 350,
            margin: _config.margin || { top: 10, right: 60, bottom: 120, left: 65 },
        };
        this.data = _data;
        this.aggregatedData = [];
        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        vis.yScale = d3.scaleLinear()
            .range([vis.height, 0]);

        vis.xScale = d3.scaleBand()
            .range([0, vis.width])
            .paddingInner(0.2);

        vis.xAxis = d3.axisBottom(vis.xScale)
            .tickSize(0)
            .tickSizeOuter(0);

        vis.yAxis = d3.axisLeft(vis.yScale)
            .ticks(8)
            .tickSize(-vis.width - 10)
            .tickPadding(10)
            .tickSizeOuter(0);

        vis.svg = d3.select(vis.config.parentElement).append('svg')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);

        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        vis.xAxisGroup = vis.chart.append('g')
            .attr('class', 'axis x-axis axis-small')
            .attr('transform', `translate(0,${vis.height})`);

        vis.yAxisGroup = vis.chart.append('g')
            .attr('class', 'axis y-axis axis-small');

        vis.chart.append('text')
            .attr('class', 'axis-label')
            .attr('text-anchor', 'middle')
            .attr('transform', 'rotate(-90)')
            .attr('y', -50)
            .attr('x', -vis.height / 2)
            .text('Number of Games');

        vis.chart.append('text')
            .attr('class', 'axis-label')
            .attr('y', vis.height - 10)
            .attr('x', vis.width + 55)
            .attr('dy', '.71em')
            .style('text-anchor', 'end')
            .text('Genres');

        vis.publisherFilter = new Map();
    }

    updateVis() {
        let vis = this;
        let aggregatedDataMap = new Map();
        vis.genrePublisherMap = new Map(); // map to be used in the tooltips
        vis.data.forEach(d => {
            let publisherInFilter = false;
            for (const pub of d['publishers']) {
                if (vis.publisherFilter.size === 0 || vis.publisherFilter.get(pub)) {
                    publisherInFilter = true;
                    break;
                }
            }

            // only if one of the publishers is in the filter
            if (publisherInFilter) d['genres'].forEach(key => {
                if (key != '') {
                    let countValue = 1;
                    if (aggregatedDataMap.has(key)) {
                        countValue = aggregatedDataMap.get(key) + 1;
                    }
                    aggregatedDataMap.set(key, countValue);

                    if (vis.publisherFilter.size > 0 && vis.publisherFilter.size < 8) {
                        // all genres, by publisher
                        let publisherMap = vis.genrePublisherMap.get(key);
                        if (!publisherMap) {
                            const map = new Map();
                            vis.genrePublisherMap.set(key, map);
                            publisherMap = map;
                        }

                        for (const pub of d['publishers']) {
                            if (vis.publisherFilter.get(pub)) { // only for publishers in this filter
                                let countValue = 1;
                                if (publisherMap.has(pub)) {
                                    countValue = publisherMap.get(pub) + 1;
                                }
                                publisherMap.set(pub, countValue);
                            }
                        }
                    }
                }
            });
        });

        vis.aggregatedData = Array.from(aggregatedDataMap, ([key, count]) => ({ key, count }));
        vis.aggregatedData = vis.aggregatedData.sort((a, b) => {
            return b.count - a.count;
        });

        vis.xValue = d => d.key;
        vis.yValue = d => d.count;

        vis.xScale.domain(vis.aggregatedData.map(vis.xValue));
        vis.yScale.domain([0, d3.max(vis.aggregatedData, vis.yValue)]);

        vis.renderVis();
    }

    renderVis() {
        let vis = this;

        const bars = vis.chart.selectAll(".bar")
            .data(vis.aggregatedData, vis.xValue)
            .join("rect")
            .attr("class", "bar")
            .attr("x", d => vis.xScale(vis.xValue(d)))
            .attr('width', vis.xScale.bandwidth())
            .attr('height', d => vis.height - vis.yScale(vis.yValue(d)))
            .attr('y', d => vis.yScale(vis.yValue(d)))
            .attr('fill', '#4187c7');

        // tooltips
        bars.on('mouseover', (event, d) => {
            d3.select('#tooltip')
                .style('display', 'block')
                .style('left', (event.pageX + 15) + 'px')
                .style('top', (event.pageY + 15) + 'px')
                .html(`
                    <p class="tooltip-title">${d.key}</p>
                    <p><span class='tooltip-bold'>Total:</span> ${d.count}</p>
                `);

            const publisherMap = vis.genrePublisherMap.get(d.key);
            if (publisherMap) {
                for (const pub of publisherMap.keys()) {
                    $('#tooltip').append(`<p><span class='tooltip-bold'>${pub}:</span> ${publisherMap.get(pub)}</p>`);
                }
            }
        });

        bars.on('mouseleave', () => {
            d3.select('#tooltip').style('display', 'none');
        });

        //Rotate tick label:
        // https://stackoverflow.com/questions/20947488/d3-grouped-bar-chart-how-to-rotate-the-text-of-x-axis-ticks
        vis.xAxisGroup
            .call(vis.xAxis)
            .selectAll('text')
            .style("text-anchor", "start")
            .attr("dy", "0.4em")
            .attr("dx", "0.5em")
            .attr("transform", "rotate(65)")
            .call(g => g.select('.domain').remove());

        vis.yAxisGroup
            .call(vis.yAxis)
            .call(g => g.select('.domain').remove());
    }
}
