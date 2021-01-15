const report = {};
/**
 * 定期レポートで取得する指標
 */
report.indexes= [];

report.setIndexes = function (indexes =['"recovered"', '"asymptomatic"', '"died"', '"symptomatic"', '"days"', '"population"']) {
    this.indexes = indexes;
}

report.addIndexes = function(idx_array) {
    for(idx of idx_array) {
        report.indexes.push(idx);
    }
}

/**
 * レポーター
 */
report.event_src= null;

/**
 * レポータのプロセスID
 */
report.process_id = '';

/**
 * getリクエストの文字列を生成する
 * @param {string} cmd - レポーターへのコマンド
 * @param {string} b_id - ブラウザID
 * @param {string} w_id - ワールドID
 * @param {float} interval - SVからの送信間隔(s)
 * @param {int} [format=2] - GET/populationのバージョンは1か2か
 */
report.configRequest = function(cmd, b_id, w_id, interval, format=2) {
    let request = '/'+ cmd + '?report=["step"';
    for(let index of this.indexes) {
        request += ',' + index;
    }
    request += "]&interval=" + interval;
    request += "&popFormat=" + format;
    if(w_id != 'default') request += "&world=" + w_id;
    request += "&me=" + b_id;
    return request;
};

/**
 * レポーターの初期化と開始
 * listenerを登録→上司にreport
 * error発生→上司にerror
 * @param {object:array} e - 上司からのmsgのデータ部分
 */
report.start = function(e) {
    const b_id = e.data[1];
    const w_id = e.data[2];
    const interval = e.data[3];
    if(report.event_src != null) {
        report.event_src.close();
        report.event_src = null;
    }
    report.process_id = '';
    report.event_src = new EventSource(this.configRequest("periodicReport", b_id, w_id, interval));
    report.event_src.addEventListener("process", function(e) {
        report.process_id = e.data;
        postMessage(["report", "add report listener"]);
    }, false);
    report.event_src.addEventListener("population", function(e) {
        if(e == 'null' || e == 'undefined') {
            postMessage(["error", "failed to get report"]);
        }
        const json = JSON.parse(e.data);
        postMessage(["draw", json, w_id]);
    }, false);
}

/*report.stop = function () {
    report.server.get(function (e) {
        postMessage(['report', e]);
    }, 'quitReport?process=' + report.process_id);
    report.event_src.close();
    report.event_src = null;
}
*/

/**
 * レポーターの報告間隔を変更
 * @param v {number} - 変更後の値(ミリ秒)
 */
report.changeInterval = function(v) {
    if(this.process_id == '') postMessage('error', 'process doesn\'t have ID.');
}

/**
 * グラフ用
 * e.data→コマンド(onmessage)，グラフコマンド, データ1...となる配列
 * @param {object:array} e - Workerの上司からきたメッセージ
 */

report.graphWork = function (e) {
    const cmd = e.data[1];
    switch(cmd) {
        case 'init':
            break;
        default:
            console.log("graphwork: undefined cmd " + cmd);

    }
}

/*
 * 上司からのメッセージを処理
 * e.data→コマンド，データ1, データ2...となる配列
 */
onmessage = function(e) {
    const cmd = e.data[0];
    switch(cmd) {
        case 'graph':
            report.graphWork(e);
            break;
        case 'start':
            report.setIndexes();
            report.start(e);
            break;
        case 'change':
            if(e.data[1] != 'interval') {
                postMessage(['error', 'ChangeReport: Unknown index ' + e.data[1]]);
                return;
            }
            const req = 'changeReport?"interval"=' + v + '&"process"=' + report.process_id;
            postMessage(['change', req]);
            break;
        case 'stop':
            if(report.process_id == '' || report.event_src == null) {
                postMessage(['error', 'This worker hasn\'t worked yet!']);
            }
            postMessage(['stop', 'quitReport?process=' + report.process_id]);
            report.event_src.close();
            break;
        default:
            postMessage(['error', 'Unknown cmd: ' + cmd]);
            break;
    }
}
