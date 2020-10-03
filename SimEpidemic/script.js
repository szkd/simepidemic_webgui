var param_types = {};
var sim_settings = {};

window.onload = function(){
    if (typeof getBrowserId() === 'undefined') {
        setBrowserId();
    }
    resetParams();
    serverGetReq(function(dict) { param_types = dict;},
        "contents/paramtype.json", responseType='json' );
    serverGetReq(function(dict) {
        sim_settings = dict;
        var file_input = document.getElementById(dict['sections']['param']['file-id']);
        file_input.value = null;
        file_input = document.getElementById(dict['sections']['scenario']['file-id']);
        file_input.value = null;
        settings('param', {"value": "tab"});
        settings('scenario', {"value": "disable"});
    },
        "contents/sim_settings.json", responseType='json');
}


function setBrowserId(storage = localStorage, key = 'simepidemicBrowerID') {
    try {
        var id = new Date();
        id = id.getTime();
        storage.setItem(key, id);
    } catch(e) {
        console.log(e);
        alert("ブラウザの設定でlocalStorageを利用可能にしてください．");
    }
}
function getBrowserId(storage = localStorage, key = 'simepidemicBrowerID') {
    try {
        return storage[key];
    } catch(e) {
        console.log(e);
        alert("ブラウザの設定でlocalStorageを利用可能にしてください．");
    }
}
/********************************************
 * パラメータ
 ***************************************** */
function sliderValueChanged(value, outputid){
    var element = document.getElementById(outputid);
    element.value=value;
    outputid.value = value;
}

function enfocedDownload(url) {
    let filename = window.prompt("ファイル名を入力してください．", "my.json");
    let a = document.createElement("a");
    a.href = url
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
}

function form2paramDict(formname, p_types) {
    var p_dict = {};
    let form_ps = document.forms[formname].elements;
    delete p_types['formname'];
    for(let id in p_types) {
        let type = p_types[id].type;
        if (type != "distribution") {
            p_dict[id] = form_ps[id].value - 0;
            continue;
        }

        let numbers = form_ps.namedItem(id);
        p_dict[id] = new Array();
        p_dict[id].push(numbers[0].value - 0);
        p_dict[id].push(numbers[1].value - 0);
        p_dict[id].push(numbers[2].value - 0);
    }
    return p_dict;
}

function saveParams(formname) {
    var callback = callbackFunc(saveJsonFile,['types', formname]);
    serverGetReq(callback, "/contents/paramtype.json", responseType='json');
}

function resetParams() {
    serverGetReq(loadParams, "getParams", responseType='json');
}

function loadParams(val_dict) {
    for(let val in val_dict) {
        if(typeof(val_dict[val]) != "object") {
            var elem = document.getElementById(val);
            elem.value = val_dict[val];
            var viewelem = document.getElementById('view' + val);
            if(viewelem !== null) {
                viewelem.value = val_dict[val];
            }
            continue;
        }
        document.getElementById(val + "-min").value = val_dict[val][0]
        document.getElementById(val + "-max").value = val_dict[val][1]
        document.getElementById(val + "-mode").value = val_dict[val][2]

    }
}
/********************************************
 * シミュレーション制御
 ***************************************** */
function settings(type, radio) {
    if(type =='param-file') {
        loadFile(radio, 'sim-setting-param');
        serverPostReq(function(val) {console.log('POST/setParams[file]: ' + val);},
            'setParams', 'file', radio);
        return;
    }
    if(type =='scenario-file') {
        loadFile(radio, 'sim-setting-scenario');
        serverPostReq(function(val) {console.log('POST/setScenario[file]: ' + val);},
            'setScenario', 'file', radio);
        return;
    }
    if(type == 'param' && radio.value == 'tab') {
        let p_dict = form2paramDict('param-form', param_types);
        serverPostReq(function(val) {console.log('POST/setParams[tab]: ' + val);},
            'setParams', 'dict', p_dict);
        return;
    }
    if(type == 'scenario' && radio.value == 'disabled') {
        serverPostReq(function(val) {console.log('POST/setScenario[disabled]: ' + val);},
            'setScenario', 'dict', [{'scenario': JSON.parse('[]')}]);
        return;
    }
    if(type == 'scenario' && radio.value == 'tab') {
        alert('シナリオのタブは使えません');
        return;
    }
}

function startSim(formname = '', world="default") {
    let result = confirm("現在の設定でシミュレーションを行います．シミュレーションの実行中は停止させるまで設定を変更することができません．よろしいですか？");
    if(!result) return;
    let form = document.forms[formname];
    if(form[sim_settings['sections']['param']['name']].value == 'file') {
        var file = document.getElementById(sim_settings['sections']['param']['file-id']);
        if(!(file.files.length > 0)) {
            alert("パラメータのファイルを選択してください．");
            return;
        }
    }
    if(form[sim_settings['sections']['scenario']['name']].value == 'file') {
        var file = document.getElementById(sim_settings['sections']['scenario']['file-id']);
        if(!(file.files.length > 0)) {
            alert("シナリオのファイルを選択してください．");
            return;
        }
    }
    for(let elem of form.elements) {
        elem.disabled = true;
    }
    serverGetReq(function(val) {console.log("start: " + val);}, 'start');
}


function stopSim(formname) {
    let result = confirm("実行中の世界を停止しますか?");
    if(!result) return;
    let form = document.forms[formname];
    for(let elem of form.elements) {
        elem.disabled = false;
    }
    serverGetReq(function(val) {console.log('stop: ' + val);},'stop', options=[{"me":getBrowserId()}]);
}

function stepSim() {
    let result = confirm("実行中の世界を1ステップ進めますか?");
    if(!result) return;
    serverGetReq(
        function(val) {console.log('step: ' + val);},
        'step',
        options=[{"me":getBrowserId()}]);
}

function resetSim() {
    let result = confirm("実行中の世界を初期化しますか?");
    if(!result) return;
    serverGetReq(
        function(val) {console.log('reset: ' + val);},
        'reset',
         options = [{"me":getBrowserId()}]
    );
}


function loadSimScenario(json_dict) {
    alert("loadSimScenario");
}

function worldList() {
    alert("未実装");
}

function getWorldId(id = '') {
    if (id != '') {
        alert("既定世界のIDは "+ id + " です．");
        return;
    }
    serverGetReq(getWorldId, "/getWorldID");
}
/********************************************
 * 共通
 ***************************************** */
function loadFile(file_input, target='') {
    if(target == 'parampanel') {
        readJsonFile(file_input, loadParams);
    }
    else if (target == "sim-setting-param" || target == "sim-setting-scenario") {
        readJsonFile(file_input, function (result, file) {
            var filename = file_input.previousSibling;
            filename.innerText = "";
            filename.innerText = " " + file.name;
        });
    }
    else if (target == "sim-setting-scenario") {
        readJsonFile(file_input, loadSimScenario);
    }
    else {
        alert("何しにきたん？");
    }
}

function dict2formdata(dict) {
    var fd = new FormData();
    for (key in dict) {
        fd.append(key, dict[key]);
    }
    return fd;
}
//json
function readJsonFile(file_input, callback) {
    var file = file_input.files[0];
    var reader = new FileReader();
    file_input.reset;
    reader.onerror = () => {
        alert("ファイル読み込みに失敗しました．");
    }
    reader.onload = function(e) {
        callback(JSON.parse(reader.result), file);
    }
    reader.readAsText(file);
}

function saveJsonFile(dict, process='save', formname) {
    if(process == 'types') {
        dict = form2paramDict(formname, dict);
    }
    let writejson = JSON.stringify(dict);
    let blob = new Blob([writejson], {type: 'application/json'});
    let fakeurl = URL.createObjectURL(blob);

    var userAgent = window.navigator.userAgent.toLowerCase();

    if(userAgent.indexOf('msie') != -1
        || userAgent.indexOf('edge') != -1
        || userAgent.indexOf('chrome') != -1) {
        enfocedDownload(fakeurl);
    }
    else if(userAgent.indexOf('safari') != -1
        || userAgent.indexOf('firefox') != -1) {
        alert("新しいタブでJSONファイルを開きます．\nFirefoxをお使いの方は左上の保存ボタン，Safariをお使いの方は右クリック→ページを別名で保存，を使って保存してください．");
        window.open(fakeurl);
    } else {
        enfocedDownload(fakeurl);
    }
}


//server
function callbackFunc(func, arg_arr) {
    return function(value) {
        return func(value, ...arg_arr);
    }
}

function serverGetReq(callback, _req, responseType ='', options = []) {
    var req = new XMLHttpRequest();
    for (idx = 0; idx < options.length; idx++) {
        if(idx == 0) _req += '?';
        if(idx > 0) _req += '&';
        _req += options[idx][name] + '=' + options[idx][value];
    }
    req.open("GET", _req);
    req.timeout = 2000;
    if(responseType != ''){
        req.responseType = responseType;
    }
    req.onload = function(){
        callback(req.response);
    }
    req.error = function() {
        alert("Error:");
    };
    req.send();
}

function serverPostReq(callback, action, type, senddata, name='') {
    var fd = new FormData();
    var req = new XMLHttpRequest();
    req.eroor = function () {
        alert("ERROR:POST " + action);
    }
    req.onload=function() {
        callback(req.response);
    }
    req.open('POST', action);

    if (type == 'form') {
        req.send(new FormData(senddata));
        return;
    }
    if (type == 'dict') {
        for(var key in senddata) {
            fd.append(key, senddata[key]);
        }
        req.send(fd);
        return;
    }
    if(type=="file" && senddata.files.length > 0) {
        fd.append(name, senddata.files[0]);
        req.send(fd);
        return;
    }
    if (type=="file") {
        alert('ファイルを選択してください');
        return;
    }
}

