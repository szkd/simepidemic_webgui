
/**
 * @namespace
 */
const popup = {};

popup.stacked_keys = ["died","asymptomatic", "symptomatic", "recovered", "susceptible"];
popup.index_keys = ["susceptible", "asymptomatic", "symptomatic", "recovered", "died",
    "quarantineAsymptomatic", "quarantineSymptomatic",
    "tests", "testPositive", "testNegative",
    "testAsSymptom", "testAsContact", "testAsSuspected"];
popup.positiveRate_key = "testPositiveRate";
popup.distribution_keys = ["incubasionPeriod", "recoveryPeriod", "fatalPeriod", "infects", "contacts"];
/**
 * contacts(接触者数(人)/人日)は未実装
 */
popup.distribution_keys = ["incubasionPeriod", "recoveryPeriod", "fatalPeriod",
    "infects", "contacts"];

popup.msg = {
    update: {
        "JA": "更新",
        "EN": "Update"
    },
    stack: {
        title: {
            "JA": "全体構成変化",
            "EN": "Whole"
        },
        indexes: {
            died: {
                "JA": "死亡者数",
                "EN": "Died"
            },
            asymptomatic: {
                "JA": "無症状感染者数",
                "EN": "Asymptmatic"
            },
            symptomatic: {
                "JA": "発症感染者数",
                "EN": "Symptomatic"
            },
            recovered: {
                "JA": "快復者数",
                "EN": "Recovered"
            },
            susceptible: {
                "JA": "未感染者数",
                "EN": "Susceptible"
            }
        }
    },
    index: {
        title: {
            "JA": "指標別変化",
            "EN": "Indexes..."
        },
        indexes: {
            died: {
                "JA": "死亡者数",
                "EN": "Died"
            },
            asymptomatic: {
                "JA": "無症状感染者数",
                "EN": "Asymptmatic"
            },
            symptomatic: {
                "JA": "発症感染者数",
                "EN": "Symptomatic"
            },
            recovered: {
                "JA": "快復者数",
                "EN": "Recovered"
            },
            susceptible: {
                "JA": "未感染者数",
                "EN": "Susceptible"
            },
            quarantineAsymptomatic: {
                "JA": "無症状隔離数",
                "EN": "QuarantineAsymptomatic"
            },
            quarantineSymptomatic: {
                "JA": "有症状隔離数",
                "EN": "QuarantineSymptomaticr"
            },
            tests: {
                "JA": "検査数",
                "EN": "Tests"
            },
            testPositive: {
                "JA": "陽性者数",
                "EN": "Test Positive"
            },
            testNegative: {
                "JA": "陰性者数",
                "EN": "testNegative"
            },
            testAsSymptom: {
                "JA": "発症者検査数",
                "EN": "Test as Symptomatic"
            },
            testAsContact: {
                "JA": "接触者検査数",
                "EN": "Test as Contact"
            },
            testAsSuspected: {
                "JA": "擬症状者数",
                "EN": "Test as Suspected"
            }
        }
    },
    testPositiveRate: {
        title: {
            "JA": "陽性率",
            "EN": "Test Positive Rate"
        },
        indexes: {
            testPositiveRate: {
                "JA": "陽性率",
                "EN": "Test Positive Rate"
            }
        }
    },
    distributions: {
        title: {
            "JA": "分布情報",
            "EN": "Distributions"
        },
        indexes: {
            incubasionPeriod: {
                "JA": "潜伏期間",
                "EN": "Incubation Period"
            },
            recoveryPeriod: {
                "JA": "快復期間",
                "EN": "Recovery Period"
            },
            fatalPeriod: {
                "JA": "生存期間",
                "EN": "Fataal Period"
            },
            infects: {
                "JA": "伝染数",
                "EN": "Infects"
            },
            contacts: {
                "JA": "接触者数",
                "EN": "Contacts"
            }
        }
    }
}
    popup.makeLegend = function (indexes) {
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

        addPartial("h2", popup.msg.stack.title[LANG]);
        addPartial("div", "", [{ name: 'id', value: 'stack-graph' }]);

        addPartial("h2", popup.msg.index.title[LANG]);
        addPartial("div", "", [{ name: 'id', value: 'indexes-graph' }]);

        addPartial("h2", popup.msg.testPositiveRate.title[LANG]);
        addPartial("div", "", [{ name: 'id', value: 'rate-graph' }]);

        addPartial("h2", popup.msg.distributions.title[LANG]);
        addPartial("div", "", [{ name: 'id', value: 'distributions' }]);

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

    popup.normalizeDataset = function(dataset, index_keys) {
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
        const data = popup.normalizeDataset(dataset, popup.stacked_keys);
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
            .style("fill", function(d) {return color(d.key)})
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
    }

popup.colorScheme = function(domain) {
    const color = d3.scaleOrdinal()
        .domain(domain)
        .range(d3.schemeSet3);
    return color;
}

popup.drawIndexesChart = function (dataset, scale_x, scale_y) {
    const height = popup.graph_width * popup.aspect;
    popup.initChart('indexes', 'indexes-graph');
    const day = dataset['days'];
    const color = popup.colorScheme(popup.index_keys);
    const svg = d3.select("#indexes-svg");
    const line_maker  = d3.line()
        .defined(d => !isNaN(d))
        .y(function(d) { return scale_y(d);})
        .x((d, i) => scale_x(day * (i / dataset[popup.index_keys[0]].length)));
    const group = svg.append("g");
    for(let name of popup.index_keys) {
    group.append("path")
        .datum(dataset[name])
        .join("path")
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
        .style("stroke", color(name))
        .attr("stroke-width", 2)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("d", line_maker);
    const x_axis = svg.append("g")
        .call(d3.axisBottom(scale_x))
        .attr('transform', `translate(70, ${height - 30})`);
    const y_axis = svg.append("g")
        .attr('transform', 'translate(70, -30)')
        .call(d3.axisLeft(scale_y));
}

popup.drawChart = function(dataset, popsize, type) {
    const width = popup.graph_width;
    const height = width * popup.aspect;
    const day = dataset['days'];
    document.getElementById('day').innerText = day;

    const scale_x = d3.scaleLinear()
        .domain([0, day])
        .range([0, width-100]);

    const scale_y = d3.scaleLinear()
        .domain([0, popsize])
        .range([height, 50]);

    switch(type) {
        case 'stack':
            popup.drawStackedChart(dataset, scale_x, scale_y);
            break;
        case 'indexes':
            popup.drawIndexesChart(dataset, scale_x, scale_y);
            break;
        case 'rate':
            popup.drawPositiveRate(dataset, scale_x);
            break;
        default:
            console.log('Unknown chart type' + type);
    }
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
    const chart_types = ['stack',];
    const w_id = tool.getHiddenValues('props')['w_id'];
    const pop_size = popup.getPopSize();
    popup.getData(w_id, popup.stacked_keys,
        tool.callbackFunc(popup.drawChart, [pop_size, 'stack']));
    popup.getData(w_id, popup.index_keys,
        tool.callbackFunc(popup.drawChart, [pop_size, 'indexes']));
    popup.getData(w_id, [popup.positiveRate_key],
        tool.callbackFunc(popup.drawChart, [pop_size, 'rate']));
}

//Main Script
const lang = document.getElementById('lang');
const w_id = document.getElementById('w_id');
server.get((v)=>{
    document.body.appendChild(
        popup.content(w_id.innerText)
    );
    //console.log(v.populationSize);
    tool.setHiddenValues({
        'popsize': v.populationSize,
        'w_id': w_id.innerText
    }, "props");
    updateCharts();
}, "getParams?world=" + w_id.innerText, responseType="json");



//console.log(popup.getData(['susceptible', 'asymptomatic', 'symptomatic', 'recovered', 'died']));
