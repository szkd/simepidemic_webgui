
/**
 * @namespace
 */
const popup = {};

popup.stacked_keys = ["died","asymptomatic", "symptomatic", "recovered", "vaccinated", "susceptible"];
popup.index_keys = {
    idx: ["died","asymptomatic", "symptomatic", "recovered", "vaccinated", "susceptible",
        "quarantineAsymptomatic", "quarantineSymptomatic",
        "tests", "testPositive", "testNegative",
        "testAsSymptom", "testAsContact", "testAsSuspected"]};
popup.positiveRate_key = "testPositiveRate";
/**
 * contacts(接触者数(人)/人日)は未実装
 */
popup.distribution_keys = ["incubasionPeriod", "recoveryPeriod", "fatalPeriod", "infects"];

popup.msg = "";

function indexFilter(obj, idx) {
    console.log(idx);
    const p = popup.index_keys.idx.findIndex(name => name == idx);
    if(p < 0) {
        console.log("Error: " + idx + 'is not found');
        return;
    }
    const path_name = idx + '-path';
    const path = document.getElementById(path_name);
    if(obj.checked) {
        const color = popup.colorScheme(popup.index_keys.idx);
        obj.labels[0].innerHTML = "■";
        popup.index_keys.visible[p] = true;
        path.setAttribute('display', 'block');
    } else {
        popup.index_keys.visible[p] = false;
        obj.labels[0].innerHTML = "<span style='color: black;display:inline-block; padding:0px 2.1px;'>×</span>";
        path.setAttribute('display', 'none');
    }
}

popup.makeLegend = function (name, p_node_id, indexes, w, margin_x, margin_y, step = 20) {
    const color = popup.colorScheme(indexes);
    const id = popup.initChart(name, p_node_id, w, margin_y + step * indexes.length);
    const legend_svg = d3.select(`#${id}`);
    const legend_values = [];
    for (let i = 0; i < indexes.length; i++) {
        legend_values.push(popup.msg.index[indexes[i]][popup.getLanguage()]);
    }
    const legend = legend_svg.selectAll('.legends')
        .data(legend_values)
        .enter()
        .append('g')
        .attr("class", "legends")
        .attr("transform", function(d, i) {
            return `translate(0, ${margin_y + i * step})`;
        });
    //凡例の色付き四角
    legend.append('rect').attr("x", 0).attr("y", 0)
        .attr("width", 10).attr("height", 10)
        .style("fill", function (d, i) {
            return color(indexes[i]); });

    //凡例の本文
    legend.append('text').attr("x", 10).attr("y", 10)
        .text(function (d, i) { return d;})
        .attr("class", "textselected")
        .style("text-anchor", "start")
        .style("font-size", 11);
    legend_svg.attr('transform', `translate(${popup.graph_width + margin_x}, 0)`);
}

popup.getData = function (w_id, idxes, callback, req_type ='index') {
    let req = "";
    switch(req_type) {
        case 'index':
            req  = 'getIndexes?world=' + w_id + '&me=' + tool.getBrowserId()
                + '&fromDay=0&days=1&' + idxes.join("=1&") + "=1";
            server.get(callback,  req,  responseType = "json");
            break;
        case 'distribution':
            req  = 'getDistribution?world=' + w_id + '&me=' + tool.getBrowserId()
                + '&' + idxes.join("=1&") + "=1";
            server.get(callback,  req,  responseType = "json");
            break;
        default:
            console.log("popup.getData: Error unknown type " + req_type);
    }
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

    const LANG = popup.getLanguage();
    addPartial("h1", "World:: " + w_id);
    addPartial("span", "Day: ", [
        {name: 'style', value: 'display: inline-block; margin-right: 0.5em; font-size: 1.5em;'}
    ]);
    addPartial("span", "", [
        {name: 'id', value: 'day'},
        {name: 'style', value: 'display: inline-block; margin-right: 0.5em; font-size: 1.5em;'}
    ]);
    addPartial("button", popup.msg.update[LANG], [
        { name: 'class', value: "command-button" },
        { name: 'onclick', value: "updateCharts();" }]);

    addPartial("h2", popup.msg.title.stack[LANG]);
    addPartial("div", "", [{ name: 'id', value: 'stack-graph' }]);

    addPartial("h2", popup.msg.title.index[LANG]);
    addPartial("div", "", [{ name: 'id', value: 'index-graph' }]);

    addPartial("h2", popup.msg.title.testPositiveRate[LANG]);
    addPartial("div", "", [{ name: 'id', value: 'rate-graph' }]);

    addPartial("h2", popup.msg.title.distribution[LANG]);
    addPartial("div", "", [{ name: 'id', value: 'distribution' }]);

    wrapper.appendChild(main);
    return wrapper;
}

popup.graph_width = 350;
popup.legend_width = 250;
popup.aspect = 0.56;

popup.initChart = function (type, pnode_id, w = 0, h = 0) {
    if(w == 0 && h == 0) {
        w = popup.graph_width + popup.legend_width + 10;
        h = popup.graph_width * popup.aspect;
    }
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

popup.makeStackedDataset = function(dataset, index_keys) {
    const data = [];
    for (let i = 0; i < dataset[index_keys[0]].length; i++) {
        data.push({});
        for(let name of index_keys) {
            data[i][name] = dataset[name][i];
        }
    }
    return data;
}

popup.drawStackedChart = function(dataset, scale_x, scale_y) {
    const height = popup.graph_width * popup.aspect;
    popup.initChart('stack', 'stack-graph');
    const day = dataset['days'];
    const data = popup.makeStackedDataset(dataset, popup.stacked_keys);
    const stacked_series = d3.stack()
        .keys(popup.stacked_keys)
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone)(data);
    const color = popup.colorScheme(popup.stacked_keys);
    const area_maker = d3.area()
        .x((d, i) => scale_x(day * (i / data.length)))
        .y0(function(d) { return scale_y(d[0]);})
        .y1(function(d) { return scale_y(d[1]);});
    d3.select("#stack-svg")
        .selectAll("mylayers")
        .data(stacked_series)
        .join("path")
        .style("fill", function(d) {
            return color(d.key)})
        .attr("d", area_maker)
        .attr('transform', "translate(70, -30)");
    const x_axis = d3.select("#stack-svg")
        .append("g")
        .call(d3.axisBottom(scale_x))
        .attr('transform', `translate(70, ${height - 30})`);
    const y_axis = d3.select("#stack-svg")
        .append("g")
        .attr('transform', 'translate(70, -30)')
        .attr('fill', 'white')
        .call(d3.axisLeft(scale_y));
    //凡例
    popup.makeLegend('stacked-legends', 'stack-svg', popup.stacked_keys, popup.legend_width, 80, 30);
}

popup.colorScheme = function(domain) {
    const mypalette = [
        "dimgray",
        "#c9fd51",
        "#ff6f91",
        "#ff9671",
        "#68edcb",
        "#00d6ec",
        "mediumseagreen",
        "crimson",
        "#d65db1",
        "#ffc75f",
        "#2c73d2",
        "indigo",
        "teal",
        "#845ec2"
    ];
    const color = d3.scaleOrdinal()
        .domain(domain)
        .range(mypalette);
    return color;
}

popup.drawIndexesChart = function (dataset, scale_x, scale_y) {
    const color = popup.colorScheme(popup.index_keys.idx);
    const p_id = 'index-graph';
    const p_node = document.getElementById(p_id);
    p_node.innerHTML = '';
    const filter = document.createElement('div');
    filter.setAttribute('style', 'display: flex; flex-wrap: wrap;');
    let cboxes = "";

    for(let idx of popup.index_keys.idx) {
        const id = `${idx}-cbox`;
        cboxes += "<div>";
        cboxes += `<label for="${id}" style="border: solid 0.5px black; color: ${color(idx)};">■</label>`;
        cboxes += `<input id="${id}" type="checkbox" style="display:none;" onchange="indexFilter(this, '${idx}');" checked="checked">`;
        cboxes += '<span style = "display: inline-block; margin-left: 3px; margin-right: 10px;">'
        cboxes += popup.msg.index[idx][popup.getLanguage()];
        cboxes += "</span>";
        cboxes += "</div>";
    }
    filter.innerHTML = cboxes;
    p_node.appendChild(filter);

    const height = popup.graph_width * popup.aspect;
    popup.initChart('index', p_id);
    const day = dataset['days'];
    const svg = d3.select("#index-svg");
    const line_maker  = d3.line()
        .defined(d => !isNaN(d))
        .y(function(d) { return scale_y(d);})
        .x((d, i) => scale_x(day * (i / dataset[popup.index_keys.idx[0]].length)));
    const group = svg.append("g");
    for(let p in popup.index_keys.idx) {
        const name = popup.index_keys.idx[p];
        group.append("path")
            .datum(dataset[name])
            .join("path")
            .attr('id', `${name}-path`)
            .attr('transform', 'translate(70, -30)')
            .attr("fill", "none")
            .style("stroke", color(name))
            .attr("stroke-width", 2)
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("d", line_maker);
    }
    const x_axis = svg.append("g")
        .call(d3.axisBottom(scale_x))
        .attr('transform', `translate(70, ${height - 30})`);
    const y_axis = svg.append("g")
        .attr('transform', 'translate(70, -30)')
        .call(d3.axisLeft(scale_y));

    //凡例
    //popup.makeLegend('index-legends', 'index-svg', popup.index_keys, popup.legend_width, 80, 30);
}

popup.drawPositiveRate = function (dataset, scale_x) {
    const height = popup.graph_width * popup.aspect;
    popup.initChart('rate', 'rate-graph');
    const day = dataset['days'];
    const color = popup.colorScheme([popup.positiveRate_key]);
    const svg = d3.select("#rate-svg");
    const series = dataset[popup.positiveRate_key];
    const scale_y = d3.scaleLinear()
        .domain([0, d3.max(series) + 2])
        .range([height, 50]);
    const line_maker  = d3.line()
        .defined(d => !isNaN(d))
        .y(function(d) { return scale_y(d);})
        .x((d, i) => scale_x(day * (i / series.length)));
    svg.append("path")
        .datum(series)
        .join("path")
        .attr('transform', 'translate(70, -30)')
        .attr("fill", "none")
        .style("stroke", color(popup.positiveRate_key))
        .attr("stroke-width", 1)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("d", line_maker);
    const x_axis = svg.append("g")
        .call(d3.axisBottom(scale_x))
        .attr('transform', `translate(70, ${height - 30})`);
    const y_axis = svg.append("g")
        .attr('transform', 'translate(70, -30)')
        .call(d3.axisLeft(scale_y));
    //凡例
    popup.makeLegend('rate-legends', 'rate-svg', [popup.positiveRate_key], popup.legend_width, 80, 30);
}

popup.drawDistribution = function(dataset) {
    console.log("distribution");
    console.log(dataset);
    const height = popup.graph_width * popup.aspect;
}


popup.drawChart = function(dataset, popsize, type) {
    if(type == 'distribution') {
        popup.drawDistribution(dataset);
        return;
    }
    const height = popup.graph_width * popup.aspect;

    const day = dataset['days'];
    document.getElementById('day').innerText = day;
    const scale_x = d3.scaleLinear()
        .domain([0, day])
        .range([0, popup.graph_width]);

    const scale_y = d3.scaleLinear()
        .domain([0, popsize])
        .range([height, 50]);

    if(type == 'stack') popup.drawStackedChart(dataset, scale_x, scale_y);
    if(type == 'index') {
        popup.drawIndexesChart(dataset, scale_x, scale_y);
    }
    if(type == 'rate') popup.drawPositiveRate(dataset, scale_x);
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
    popup.getData(w_id, popup.stacked_keys,
        tool.callbackFunc(popup.drawChart, [pop_size, 'stack']));
    popup.getData(w_id, popup.index_keys.idx,
        tool.callbackFunc(popup.drawChart, [pop_size, 'index']));
    popup.getData(w_id, [popup.positiveRate_key],
        tool.callbackFunc(popup.drawChart, [pop_size, 'rate']));
    popup.getData(w_id, popup.distribution_keys,
        tool.callbackFunc(popup.drawChart, [pop_size, 'distribution']),
        'distribution');
}

//Main Script
console.log('load popup script');
const lang = document.getElementById('lang');
const w_id = document.getElementById('w_id');
server.get((m)=>{
    popup.msg = m;
    server.get((p)=>{
        popup.index_keys.visible = popup.index_keys.idx.map(()=>{return true;})
        console.log(popup.index_keys);
        document.body.appendChild(
            popup.content(w_id.innerText)
        );
        tool.setHiddenValues({
            'popsize': p.populationSize,
            'w_id': w_id.innerText
        }, "props");
        updateCharts();
    }, "getParams?world=" + w_id.innerText, responseType="json");
}, "contents/stats_msg.json", responseType = "json");
