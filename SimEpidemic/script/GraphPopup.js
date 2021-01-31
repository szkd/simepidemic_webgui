
/**
 * @namespace
 */
const popup = {};

popup.stacked_keys = ["died","asymptomatic", "symptomatic", "recovered", "susceptible"];

popup.msg = {
    update: {
        "JA": "更新",
        "EN": "Update"
    },
    stackTitle: {
        "JA": "全体構成変化",
        "EN": "Whole"
    }
}

popup.getData = function (w_id, idxes, callback) {
    const req = 'getIndexes?world=' + w_id + '&me=' + tool.getBrowserId()
        + '&fromDay=0&days=1&' + idxes.join("=1&") + "=1";
    server.get(callback, req, responseType = "json");
}

popup.content = function (w_id) {
    const wrapper = document.createElement('div');
    wrapper.setAttribute('id', 'wrapper');

    const main = document.createElement('main');
    main.setAttribute('class', 'graph_popup');

    function addPartial(tag, text, attrs = []) {
        const content = document.createElement(tag);
        content.innerText = text;
        if(attrs != []) {
            attrs.map((x) => {
                content.setAttribute(x.name, x.value);
                return x;
            });
        }
        main.appendChild(content);
    }

    addPartial("h1", "World:: " + w_id);
    addPartial("span", "Day: ", [
        {name: 'style', value: 'display: inline-block; margin-right: 0.5em; font-size: 1.5em;'}
    ]);
    addPartial("span", "", [
        {name: 'id', value: 'day'},
        {name: 'style', value: 'display: inline-block; margin-right: 0.5em; font-size: 1.5em;'}
    ]);
    addPartial("button", popup.msg.update[popup.getLanguage()], [
        { name: 'class', value: "command-button" },
        { name: 'onclick', value: "updateCharts();" }]);
    addPartial("h2", popup.msg.stackTitle[popup.getLanguage()]);
    addPartial("div", "", [{ name: 'id', value: 'stack-graph' }]);

    wrapper.appendChild(main);
    return wrapper;
}

popup.graph_width = 500;

popup.aspect = 0.56;

popup.initChart = function (type, pnode_id) {
    const w = popup.graph_width;
    const h = w * popup.aspect;
    const svg_id = type + '-svg';
    const svg_node = document.getElementById(svg_id);
    if(svg_node != null && svg_node != undefined) {
        svg_node.remove();
    }

    const p_node = d3.select("#" + pnode_id);
    p_node.append("svg")
        .attr("width", w)
        .attr("height", h)
        .attr("id", svg_id);
    return svg_id;
}

popup.drawChart = function(dataset, popsize) {
    const width = popup.graph_width;
    const height = width * popup.aspect;
    const day = dataset['days'];
    document.getElementById('day').innerText = day;

    const data = [];
    for (let i = 0; i < dataset[popup.stacked_keys[0]].length; i++) {
        data.push({});
        for(let name of popup.stacked_keys) {
            data[i][name] = dataset[name][i];
        }
    }
    const stacked_series = d3.stack()
        .keys(popup.stacked_keys)
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone)(data);

    const color = d3.scaleOrdinal()
        .domain(popup.stacked_keys)
        .range(d3.schemeSet3);

    const scale_x = d3.scaleLinear()
        .domain([0, day])
        .range([0, width-100]);

    const scale_y = d3.scaleLinear()
        .domain([0, popsize])
        .range([height, 50]);

    const area_maker = d3.area()
        .x((d, i) => scale_x(day * (i / data.length)))
        .y0(function(d) { return scale_y(d[0]);})
        .y1(function(d) { return scale_y(d[1]);});
    d3.select("#stack-svg")
        .selectAll("mylayers")
        .data(stacked_series)
        .join("path")
        .style("fill", function(d) {return color(d.key)})
        .attr("d", area_maker)
        .attr('transform', 'translate(70, -30)');
    const x_axis = d3.select("#stack-svg")
        .append("g")
        .call(d3.axisBottom(scale_x))
        .attr('transform', 'translate(70, ' + (height - 30) +')');
    const y_axis = d3.select("#stack-svg")
        .append("g")
        .attr('transform', 'translate(70, -30)')
        .attr('fill', 'white')
        .call(d3.axisLeft(scale_y));
}

popup.getLanguage = function() {
    const lang = document.getElementById('lang');
    if(lang == null || lang == 'undefined') {
        return 'EN';
    }
    return lang.innerText;
}

popup.getPopSize = function() {
    const props = tool.getHiddenValues('props');
    //console.log(props);
    if(props['popsize'] == undefined) {
        console.log("Error: failed to get populationSize");
        return 10000;
    }
    return props['popsize'];
}
//Popup Interfaces
function updateCharts() {
    const w_id = tool.getHiddenValues('props')['w_id'];
    const pop_size = popup.getPopSize();
    popup.initChart('stack', 'stack-graph');
    popup.getData(w_id, popup.stacked_keys,
        tool.callbackFunc(popup.drawChart, [pop_size]));
}

//Main Script
const lang = document.getElementById('lang');
const w_id = document.getElementById('w_id');
server.get((v)=>{
    document.body.appendChild(
        popup.content(w_id.innerText)
    );
    console.log(v.populationSize);
    tool.setHiddenValues({
        'popsize': v.populationSize,
        'w_id': w_id.innerText
    }, "props");
    updateCharts();
}, "getParams?world=" + w_id.innerText, responseType="json");



//console.log(popup.getData(['susceptible', 'asymptomatic', 'symptomatic', 'recovered', 'died']));
