window.onload = function(){
    if (typeof getBrowserId() === 'undefined') {
        setBrowserId();
    }
    serverGetReq(setHiddenValues, 'getParams', responseType = 'json');
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

function setHiddenValues(values, formname = 'default_values') {
    if(document.forms[formname] != undefined) {
        document.forms[formname].remove();
    }
    let f = document.createElement('form');
    f.name = formname;
    f.style = 'display:none;';
    document.body.append(f);
    let field = document.forms[formname];
    for(let name in values) {
        let elem = document.createElement("input");
        elem.type = "hidden";
        elem.name = name;
        elem.value = values[name];
        field.append(elem);
    }
}

function getHiddenValues(formname = 'default_values') {
    let d = Array.from(document.forms[formname].children);
    let dict = {};
    for (let i in d) {
        dict[d[i].name] = d[i].value;
    }
    return dict;
}

/********************************************
 * パネル
 ***************************************** */
function resetForm(formname) {
    let d = getHiddenValues();
    loadParams(d, formname);
}

function loadForm(file_input, formname) {
    readJsonFile(file_input, function(dict, file) {
        setHiddenValues(dict, 'tmp');
        loadParams(getHiddenValues('tmp'), formname);
    });
}

function saveForm(formname) {
    let formdata = form2paramDict(formname);

    let writejson = JSON.stringify(formdata);
    let blob = new Blob([writejson], {type: 'application/json'});
    let fakeurl = URL.createObjectURL(blob);

    let userAgent = window.navigator.userAgent.toLowerCase();

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

function loadParams(val_dict, formname) {
    let formdata = form2paramDict(formname);
    let form = document.forms[formname];
    let param_list = document.getElementById(formname + "-plist").innerText.split(',');
    for(let p of param_list) {
        if(val_dict[p].split(',').length > 1) {
            let v = val_dict[p].split(',');
            form[p + "-min"].value = v[0];
            form[p + "-max"].value = v[1];
            form[p + "-mode"].value = v[2];
        }
        form[p].value = val_dict[p];
        let view = document.getElementById("view" + p);
        if(view != null) view.value = val_dict[p];
    }
}


function form2paramDict(formname) {
    let p_list = document.getElementById(formname + "-plist").innerText.split(',');
    let d = getHiddenValues();
    var p_dict = {};
    let form = document.forms[formname];
    for(let p of p_list) {
        if(d[p].split(',').length > 1) {
            p_dict[p] = new Array();
            p_dict[p].push(form[p + '-min'].value - 0);
            p_dict[p].push(form[p + '-max'].value - 0);
            p_dict[p].push(form[p + '-mode'].value - 0);
            continue;
        }
        p_dict[p] = form[p].value - 0;
    }
    return p_dict;
}

//server
function callbackFunc(func, arg_arr) {
    return function(value) {
        return func(value, ...arg_arr);
    }
}

function serverGetReq(callback, _req, responseType ='', options = []) {
    var req = new XMLHttpRequest();
    if (options.length != 0) {
        for (idx = 0; idx < options.length; idx++) {
            if(idx == 0) _req += '?';
            if(idx > 0) _req += '&';
            _req += options[idx][name] + '=' + options[idx][value];
        }
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

/********************************************
 * パラメータ
 ***************************************** */
function sliderValueChanged(slider, outputid){
    let element = document.getElementById(outputid);
    element.value = slider.value;
}

function enfocedDownload(url) {
    let filename = window.prompt("ファイル名を入力してください．", "my.json");
    let a = document.createElement("a");
    a.href = url
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
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
        let p_dict = form2paramDict('param-form');
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
    if (target == "sim-setting-param" || target == "sim-setting-scenario") {
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
    let file = file_input.files[0];
    let reader = new FileReader();
    file_input.reset;
    reader.onerror = () => {
        alert("ファイル読み込みに失敗しました．");
    }
    reader.onload = function(e) {
        callback(JSON.parse(reader.result), file);
    }
    reader.readAsText(file);
}

