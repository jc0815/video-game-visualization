# CPSC 436V Project - Group 11 (Milestone 2 Update)
Members: Nawa, Nicholas, James
CS ID: d1d2b, h3v2b, i9u0b
Student ID: 46234126, 11599925, 18436162

#### External Sources Used:
1. CPSC 436V Tutorial 2 on [GitHub](https://github.com/UBC-InfoVis/2021-436V-tutorials/tree/master/2_D3_Tutorial​)
2. CPSC 436V Tutorial 3 on [Github](https://github.com/UBC-InfoVis/2021-436V-tutorials/tree/master/3_D3_Tutorial)
3. Hexbin chart on [D3 samples](https://www.d3-graph-gallery.com/graph/density2d_hexbin.html)
4. Donut chart on [Placing text on arcs with d3.js](https://www.visualcinnamon.com/2015/09/placing-text-on-arcs/)
5. D3 Curves on [Observable HQ](https://observablehq.com/@d3/curves) and D3 curve explorer at [bl.ocks.org](http://bl.ocks.org/d3indepth/b6d4845973089bc1012dec1674d3aff8)
6. Create a Custom Radio Button on [w3schools](https://www.w3schools.com/howto/howto_css_custom_checkbox.asp)
7. CPSC 436V interactive scatter plot sandbox example on [codesandbox](https://codesandbox.io/s/github/UBC-InfoVis/2021-436V-examples/tree/master/d3-interactive-line-chart)
8. Create a custom scrullbar on [w3schools](https://www.w3schools.com/howto/howto_css_custom_scrollbar.asp)

#### Additional libraries added:
1. jQuery was added to help with general page interactivity, since one of the group members was familiar with it.
2. d3-hexbin was added to create the hexbin chart.

#### Code Details:
##### index.html:
- The file contains the web page layout.
- Each view is wrapped in \<div> tag, so it is easier for us to work on them independently.

##### style.css:
- The file contains the main style layout for the project
- Loading screen styling
- Styling and positioning for each view
- Tooltips and selectors
- Custom radio buttons (External sources #6) and dropdown

##### main.js:
- The file is the main Javascript file
- First, we declare our variables, selectors, and dispatcher
- Then we load the processed CSV with D3
- With the parsed data, we perform further processing to split multi valued columns of the CSV into arrays and properly convert them to numbers and dates. Arrays with all publishers and all platforms are also created to help with creating the interactivity (selection) menus, currently only used on the linechart.
- The loading screen is then hidden, and the main controller is shown, using jQuery.
- Finally, we call all of our charts and call their updateVis() function to render
- A listener for the `setActivePublisher` dispatcher event is added, updating the scatterplot, the barchart and the selection box.
- A call for the `setActivePublisher` dispatcher event is performed on changing the selection box.
- We also added some jQuery for our selectors and view onchange updates

##### innovative.js:
- First, we setup the chart area with width, height and margins in initVis().
- In updateVis(), we prepare data for the donut chart by computing sum for each category of the selected
  attribute. Those with top 8 sum values are kept as they are, but the rest are combined and display under 'Other
 ' category. We also generate a unique sequential number for each row to be used when rendering the outer rings.
- In renderVis(), we create line marks for the outer rings to represent games. The rotate and translate
  values of each line are dynamically calculated using the abovementioned sequential numbers. The donut chart as the
  inner ring is created with d3.arc, d3.pie and path, and annotated with text labels (External sources #4). We
  added user interaction to the donut chart by allowing user to select the donut slice, and the line marks on the
  outer rings will be updated as per user's selection.
- In renderVis(), We also add listeners for mouseover/mouseleave events on each donut piece and line mark for displaying
 the tooltips.
- Lastly, we make the chart title dynamically updated as per selected year and attribute.

##### heatmap.js:
- First, we setup the heatmap area with width, height and margins in initVis()
- Then, we use jQuery to get the heatmap's variables based on user selection
- We also perform some pre-processing, primarily to get rid of zeros in data of the two features
- Then we scale and position the X and Y axis based on the selected feature's domain
- In updateVis(), we set the values for X and Y variables, and call renderVis()
- In renderVis(), we declare the colour scheme for our heatmap. Furthermore, we aggregate data points into Hexbins using the D3 Hexbin library
- Lastly, we plotted the hexbins onto the heatmap with their density (length of hexbin)

##### linechart.js:
- First, we setup the linechart area with width, height and margins in initVis().
- Also in the initVis() function, labels and static components are created. The svg is created inside the div and positioned. Scales for the X and Y axis as well as the color scale are created. Axes are initialized and groups for them are created. The main structure for interactivity is also initialized. The Y axis label is not created here because it is dynamic.
- In updateVis(), data is derived/aggregated into the needed format of games or ratings per publisher or platform. The part where labels are drawn will be moved from initVis to updateVis because they should change from rating to number of games when we select what we want to view.
- Also in updateVis(), the scale domains are calculated and set, and the line constructor is created. The Y axis label is created here because it is dynamic.
- In renderVis(), the line is drawn from the data derived in the last function, using the "join" syntax and the line constructor. The axis and labels are also drawn.
- Also in renderVis(), listeners are added for mouse events. Using these events, the tooltip is drawn and positioned, and also the vertical white line to indicate what year we are hovering + legend.
...
##### scatterplot.js:
- First, we setup the scatterplot area with width, height and margins in initVis().
- Also in the initVis() function, labels and static components are created. The svg is created inside the div and positioned. Scales for the X and Y axis are created. Axes are initialized and groups for them are created.
- In updateVis(), data is derived/aggregated into the needed format of average rating and number of games per publisher. We also filter out publishers with less than 10 games because the graph was too polluted with many publishers with various different ratings, with less than 10 games. The scale domains are calculated and set.
- In renderVis(), the dots are drawn from the data derived in the last function, using the "join" syntax. Each dot is a publisher. Listener for mouseover/mouseleave events are also added to display the tooltip. Finally, the axes are drawn.
- Also in renderVis(), a call for the `setActivePublisher` dispatcher event is performed when we receive a click event.
...
##### barchart.js:
- The chart area property, axes and scales are set up in initVis()
- In updateVis(), we set the scales' domains. We also calculate sum/count for each genre, and sort it by value in descending order, so it is easier to compare the values.
- The bars and their rotated labels are created in renderVis(). Listener for mouseover/mouseleave events are also added to display the tooltip.

##### preprocess.py:
- In this file, we loaded the original CSV with pandas dataframe
- Then, we dropped columns/features that we aren't exploring for our project
- Then we took out the games that weren't released yet (ie, 2020-12-22)
- We also took out games that have no ratings since many entries were zeros
- Lastly, we saved the new dataframe into processed CSV so that our D3 project didn't need to load for longer unnecessary timeframe

##### pd_profile.ipynb and pandas_profile:
- In this file, we created a pandas profile of the original dataset of our project
- We used the pandas profile to look for feature cardinality, range, missing values, as well as correlation
