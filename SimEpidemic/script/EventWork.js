const indexes = ['recovered', 'asymptomatic', 'died', 'symptomatic', 'days', 'population'];
let event_src = null;

function configRequest(cmd, b_id, w_id, interval) {
    let request = '/'+ cmd + '?report=["step"';
    for(let index of indexes) {
        request += ',' + index;
    }
    request += "]&interval=" + interval;
    request += "&popFormat=2";
    request += "&world=" + w_id;
    request += "&me=" + b_id;
    return request;
}

function init(e) {
    let process_id = '';
    const b_id = e.data[1];
    const w_id = e.data[2];
    const interval = e.data[3];
    event_src = new EventSource(configRequest("periodicReport", b_id, w_id, interval, ''));
    event_src.addEventListener("process", function(e) {
        process_id = e.data;
        config = function (cmd, interval_ms) {
            return configRequest(cmd, b_id, w_id, interval_ms, process_id);
        };
        postMessage(["report", "add report listener"]);
    }, false);
    event_src.addEventListener("population", function(e) {
        if(e == 'null') {
            postMessage(["error", "failed to add population listener"]);
        }
        const json = JSON.parse(e.data);
        postMessage(["draw", json]);
    }, false);
}

function changeInterval(v) {
    if(process_id == '') postMessage('error', 'Process doesn\'t have id. Please post init msg.');
    serverGetReq(function (e) {
        postMessage(['report', e]);
    }, 'changeReport?interval=' + v + '&process=' + process_id);
}
onmessage = function(e) {
    const cmd = e.data[0];
    switch(cmd) {
        case 'init':
            init(e);
            break;
        case 'change':
            if(e.data[1] != 'interval') {
                postMessage(['error', 'ChangeReport: Unknown index ' + e.data[1]]);
                return;
            }
            changeInterval(e.data[2]);
            break;
        default:
            postMessage(['error', 'Unknown cmd: ' + cmd]);
            break;
    }
}
