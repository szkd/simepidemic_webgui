
/**
 * @namespace
 */
const popup = {};

popup.lang = "";

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

    let content = document.createElement('h1');
    content.innerText = "World:: " + w_id;
    main.appendChild(content);

    content = document.createElement('button');
    content.setAttribute('class', 'command-button');
    content.innerText = popup.msg.update[popup.lang];
    main.appendChild(content);

    content = document.createElement('h2');
    content.innerText = popup.msg.stackTitle[popup.lang];
    main.appendChild(content);

    content = document.createElement('div');
    content.setAttribute('id', 'stack-graph');
    main.appendChild(content);

    wrapper.appendChild(main);
    return wrapper;
}

popup.drawchart = function(dataset) {
    const p_node = d3.select("#stack-graph");
    const width = 800;
    const height = 600;
    p_node.append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("id", "stack-svg");

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

    var color = d3.scaleOrdinal()
        .domain(popup.stacked_keys)
        .range(d3.schemeSet3);
    const scale_x = d3.scaleLinear()
        .domain([0, data.length])
        .range([0, width * 0.9]);
    const scale_y = d3.scaleLinear()
        .domain([0, 10000])
        .range([height * 0.9, 0]);
    const area_maker = d3.area()
        .x((d, i) => scale_x(i))
        .y0(function(d) {  return scale_y(d[0]);})
        .y1(function(d) { return scale_y(d[1]);});
    d3.select("#stack-svg")
        .selectAll("mylayers")
        .data(stacked_series)
        .join("path")
        .style("fill", function(d) {return color(d.key)})
        .attr("d", area_maker)
        .attr('transform', 'translate(50, 10)');
    const x_axis = d3.select("#stack-svg")
        .append("g")
        .call(d3.axisBottom(scale_x))
        .attr('transform', 'translate(50, ' + (10 + height * 0.9) + ')');
    const y_axis = d3.select("#stack-svg")
        .append("g")
        .attr("fill", "white")
        .attr('transform', 'translate(50, 10)')
        .call(d3.axisLeft(scale_y));
}

popup.initGraph = function(area_id, indexes) {
    const svg = graph.initSVG(area_id);
    const dataset = getData(indexes);
    const axes = grapn.defineAxes(
        d3.scale.linear().range([0, svg.width]),
        d3.scale.linear().range([svg.height, 0]),
        10, 10);
    svg.append("g")
        .attr("transform", "translate(0, " + svg.height + ")")
        .call(axes.x);
    svg.append("g")
        .call(axes.y);
}

//window.onload = function (){
console.log(popup.lang);
    popup.getData('default', popup.stacked_keys,
        function (v) {
            popup.drawchart(v);
    });
    const lang = document.getElementById('lang');
    const w_id = document.getElementById('w_id');
    popup.lang = lang.innerText;
    tool.setHiddenValues({'w_id': w_id.innerText}, "worldID");
    document.body.appendChild(
        popup.content(w_id.innerText)
    );
    lang.remove();
    w_id.remove();

console.log("popup");

//}


//console.log(popup.getData(['susceptible', 'asymptomatic', 'symptomatic', 'recovered', 'died']));
