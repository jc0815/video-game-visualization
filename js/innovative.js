class Innovative {

    constructor(_config, _data, _selectedAttr, _selectedYear) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 950,
            containerHeight: _config.containerHeight || 1000,
            margin: _config.margin || {top: 15, right: 15, bottom: 15, left: 15},
            tooltipPadding: _config.tooltipPadding || 15
        };
        this.data = _data;
        this.selectedAttr = _selectedAttr;
        this.selectedYear = _selectedYear;
        this.initVis();
    }

    initVis() {
        const vis = this;

        // calculate view size
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        vis.filterWidth = 50;
        vis.viewBoxPadding = 40;

        //filter games released in 2020 to be used as default data
        vis.data = data.filter(d => d['released'].getFullYear() === 2020);

        // create svg and chart containers
        vis.svg = d3.select(vis.config.parentElement).append('svg')
            .attr('id', 'innovative-chart-area')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight)
            .attr('viewBox', [-vis.width/2 + vis.viewBoxPadding, -vis.width/2 + vis.viewBoxPadding - 20,
                vis.width - vis.viewBoxPadding + 30, vis.width - vis.viewBoxPadding + 30]);

        vis.chartContainer = vis.svg.append('g')
            .attr('id', 'data-point-container')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        vis.filterContainer = vis.svg.append('g')
            .attr('id', 'filter-container')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

    }

    updateVis() {
        const vis = this;
        let counter = 1;

        //uniqueSelectedAttrValues: list of objects for storing category as key and its sum as value
        vis.uniqueSelectedAttrValues = [];
        vis.sumDonutChart = 0;

        //topEightSumValues: list of keys whose sum is in top eight in uniqueSelectedAttrValues
        vis.topEightSumValues = [];

        //filter data with released year < 1980, when 'before1980' is selected
        vis.data = data.filter(d =>
            (vis.selectedYear === 'before1980'?
                d['released'].getFullYear() < 1980 :
                d['released'].getFullYear() == vis.selectedYear) && d[vis.selectedAttr] != '' );

        //prepare data for donut chart
        vis.data.forEach(d => {
            vis.generateDataForDonutChart(vis, d, vis.selectedAttr, vis.uniqueSelectedAttrValues);
            //add sequential number to each row to be used when rendering the view
            d.number = counter;
            counter++;
        });

        //sort uniqueSelectedAttrValues by value
        vis.uniqueSelectedAttrValues = vis.uniqueSelectedAttrValues.sort((a, b) => {
            return b.value - a.value;
        });

        //combine sums in uniqueSelectedAttrValues whose rank > 8, and use "Other" as key
        let sumOther = 0;
        for(let i = 0; i < vis.uniqueSelectedAttrValues.length; i++){
            let val = vis.uniqueSelectedAttrValues[i].value;
            vis.sumDonutChart += val;
            if(i >= 8){
                sumOther += val;
                vis.uniqueSelectedAttrValues[i].value = 0;
            }
        }
        vis.uniqueSelectedAttrValues.push({key: "Other", value: sumOther});
        vis.uniqueSelectedAttrValues = vis.uniqueSelectedAttrValues.filter(game => game.value !== 0);
        vis.uniqueSelectedAttrValues.forEach(item => vis.topEightSumValues.push(item.key));

        d3.select('#innovative-view .chart-title').text(() => {
            return vis.getChartTitle(vis.selectedAttr, vis.selectedYear);
        });

        vis.renderVis();
    }

    renderVis() {
        const vis = this;

        const lines = vis.chartContainer.selectAll('.line-game')
            .data(vis.data, d => d.id)
            .join('line')
            .attr('class', 'line-game')
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', 18)
            .attr('y2', 0)
            .attr('transform', d => {
                //calculate transform value of the line mark
                const dataSize = vis.data.length;
                const maxLinesPerRing = 240;
                const numLinesPerRing = dataSize < maxLinesPerRing ? dataSize : maxLinesPerRing;
                const numLinesLastRing = dataSize < maxLinesPerRing ? dataSize : dataSize % maxLinesPerRing;
                const totalRow = Math.ceil(dataSize/numLinesPerRing);
                const rowth = Math.ceil(d.number/numLinesPerRing);
                const xtranslate = 260 + (rowth * 30);
                let degree = rowth === totalRow ? 360/numLinesLastRing : 360/numLinesPerRing;
                return `rotate(${d.number * degree}) translate(${xtranslate},0)`;
            });

        lines.on('mouseover', (event,d) => {
                d3.select('#tooltip')
                    .style('display', 'block')
                    .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')
                    .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
                    .html(vis.generateGameTooltipContent(d));
            })
            .on('mouseleave', () => {
                d3.select('#tooltip').style('display', 'none');
            });

        //Create donut chart with text labels
        //Reference: https://www.visualcinnamon.com/2015/09/placing-text-on-arcs/
        const arc = d3.arc()
            .innerRadius((vis.width-150)*0.5/2)
            .outerRadius((vis.width-150)*0.5/2 + vis.filterWidth);

        const donutchart = d3.pie()
            .startAngle(-90 * Math.PI/180)
            .endAngle(-90 * Math.PI/180 + 2*Math.PI)
            .value(d => d.value)
            .padAngle(.01)
            .sort(null);

        const filters = vis.filterContainer.selectAll('.filter')
            .data(donutchart(vis.uniqueSelectedAttrValues))
            .join('path')
            .attr('class', 'filter')
            .attr('d', arc)
            .attr("id", function(d,i) { return "filterArc"+i; })
            .on('click', function(event,d) {
                //toggle class 'active' when select/deselect donut arc
                const isActive = d3.select(this).classed('active');
                d3.select(this).classed('active', !isActive);
                const selected = vis.filterContainer.selectAll('.filter.active').data().map(function (d) {
                    return d.data.key;
                });

                //update class of line marks as per selected/deselected donut arc
                if(selected.length > 0){
                    d3.selectAll('.line-game').attr('class', (d) => {
                        let validation = false;
                        switch (vis.selectedAttr) {
                            case "genres":
                                validation = vis.validatePlatformsGenres(vis.topEightSumValues, selected, d, "genres");
                                break;
                            case "platforms":
                                validation = vis.validatePlatformsGenres(vis.topEightSumValues, selected, d, "platforms");
                                break;
                            case "esrb_rating":
                                validation = vis.validateERSBRating(selected, d);
                                break;
                        }
                        return validation ? 'line-game line-active' : 'line-game line-inactive';
                    });

                    d3.selectAll('.line-game.line-inactive').on('mouseover', () => {
                        d3.select('#tooltip').style('display', 'none');
                    });

                    d3.selectAll('.line-game.line-active').on('mouseover', (event,d) => {
                        d3.select('#tooltip')
                            .style('display', 'block')
                            .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')
                            .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
                            .html(vis.generateGameTooltipContent(d));
                        })
                        .on('mouseleave', () => {
                            d3.select('#tooltip').style('display', 'none');
                        });

                }else{
                    vis.renderVis();
                }
            });

        filters.on('mouseover', (event,d) => {
                d3.select('#tooltip')
                    .style('display', 'block')
                    .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')
                    .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
                    .html(`
                        <p class="tooltip-title">${d.data.key}: ${(d.value/vis.sumDonutChart*100).toFixed(2)} %</p>
                    `);
            })
            .on('mouseleave', () => {
                d3.select('#tooltip').style('display', 'none');
            });


        d3.selectAll('.filterLabel').remove();

        let arcLength = 0;
        let textLength = 0;
        vis.filterContainer.selectAll('.filterLabel')
            .data(vis.uniqueSelectedAttrValues, d => d.key)
            .join('text')
            .attr('class', 'filterLabel')
            .attr('x', 5)
            .attr('dy', 5 + vis.filterWidth/2)
            .append('textPath')
            .attr('xlink:href', (d,i) => {
                return '#filterArc'+i;
            })
            .text((d, i) => {
                //ellipsize text if its length > arc length
                let arcNum = 'filterArc'+i;
                let textContent = d.key;
                arcLength = document.getElementById(arcNum).getTotalLength();
                textLength = textContent.length * 35;
                if(arcLength < 260){
                    textContent = "";
                }else if(textLength > arcLength){
                    let numExceedingChars = Math.ceil(Math.abs(textLength - arcLength)/35);
                    textContent = textContent.slice(0, numExceedingChars * -1) + '...';
                }

                return textContent;
            });

        if(vis.data.length === 0){
            vis.svg.append('text')
                .attr('class', 'no_data_msg')
                .attr('x', '-135')
                .attr('y', '-50')
                .text('No data for the selected attribute and year');
        }else{
            d3.select('.no_data_msg').remove();
        }
    }

    generateDataForDonutChart(vis, d, selectedAttr, uniqueSelectedAttrValues){
        if(selectedAttr === 'genres' || selectedAttr === 'platforms'){
            d[selectedAttr].forEach(val => {
                vis.generateListOfAttrValues(val, uniqueSelectedAttrValues, vis);
            });
        }else if(selectedAttr === 'esrb_rating'){
            let val = d[selectedAttr];
            vis.generateListOfAttrValues(val, uniqueSelectedAttrValues, vis);
        }
    }

    //Generate list of objects with attribute value as key and sum as value
    generateListOfAttrValues(val, uniqueSelectedAttrValues, vis){
        if(val !== ''){
            const isValDuplicated =  uniqueSelectedAttrValues.some((game) => {
                return vis.hasKey(game, val);
            });

            if(!isValDuplicated){
                uniqueSelectedAttrValues.push({key: val, value: 1});
            }else{
                uniqueSelectedAttrValues.forEach(obj => {
                    if(obj.key === val){
                        obj.value = obj.value + 1;
                    }
                });
            }
        }
    }

    hasKey(obj, keyName) {
        return obj.hasOwnProperty("key") && obj["key"] === keyName;
    }

    //Returns true if game[key] contains the selected donut arc value.
    //In case 'Other' is selected, then return true if game[key] doesn't include any key from topEightSumValues
    //(If game[key] doesn't include any key from topEightSumValues, it was previously display in 'Other' category)
    validatePlatformsGenres(topEightSumValues, selected, game, key){
        let values = game[key];
        let result = false;
        let isOther = false;

        for(let val of values){
            result = result || selected.includes(val);
            if(selected.includes('Other') && !topEightSumValues.includes(val)){
                isOther = true;
            }
        }
        return result || isOther;
    }

    //returns true if game['esrb_rating'] contains the selected ERSB rating value
    validateERSBRating(selectedVal, game){
        return selectedVal.includes(game['esrb_rating']);
    }

    //Generate chart title as per selected year and attribute
    getChartTitle(selectedAttr, selectedYear){
        let selected = selectedAttr === 'esrb_rating' ? 'ESRB rating' : selectedAttr;
        let year = selectedYear === 'before1980' ? 'before 1980' : 'in ' + selectedYear;
        selected = selected[0].toUpperCase() + selected.slice(1).toLowerCase();
        return selected + " of games released " + year;
    }

    generateGameTooltipContent(d){
        return `<p class="tooltip-title">${d.name}</p>
                <p><span class='tooltip-bold'>Rating:</span> ${d.rating}</p>
                <p><span class='tooltip-bold'>ESRB Rating:</span> ${d.esrb_rating}</p>
                <p><span class='tooltip-bold'>Genres:</span> ${d.genres}</p>
                <p><span class='tooltip-bold'>Platforms:</span> ${d.platforms}</p>
                <p><span class='tooltip-bold'>Developed by:</span> ${d.developers}</p>
                <p><span class='tooltip-bold'>Published by:</span> ${d.publishers}</p><span class='tooltip-bold'>`;
    }
}
