window.onload = function(){
    resetParams();
    if (typeof getBrowserId() === 'undefined') {
        setBrowserId();
    }
    console.log(getBrowserId());
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
function simSettings(val, name, form, settingdict) {
    if(name == 'sim-settings') {
        settingdict = val['sections'];
    }
    if (name == 'paramtype') {
        let p_dict = form2paramDict('param-form', val);
            serverPostReq(serverGetReq(function(val) {console.log("start: " + val);}, 'start'),
            'setParams', 'dict', p_dict);
        return;
    }
    //本来は先にworldのフォームを処理する
    if (form[settingdict['param']['name']].value == 'tab') {
        serverGetReq(callbackFunc(simSettings, ['paramtype', form, settingdict]),
            "contents/paramtype.json", responseType='json');
            return;
    } else if (form[settingdict['param']['name']].value == 'file') {
            serverPostReq(serverGetReq(function(val) {console.log("start: " + val);}, 'start'),
                'setParams', 'file', document.getElementById(settingdict['param']['file-id']));
        return;
    }
    if(name == 'scenario') {
        //本来はシナリオを設定する
    }
}

function startSim(formname = '', world="default") {
    let result = confirm("現在の設定でシミュレーションを行います．よろしいですか？");
    if(!result) return;
    let form = document.forms[formname];
    serverGetReq(callbackFunc(simSettings,['sim-settings', form]),
        "contents/sim_settings.json", responseType='json' );
}


function stopSim() {
    let result = confirm("実行中の世界を停止しますか?");
    if(!result) return;
    serverGetReq(function(val) {console.log('stop: ' + val);},'stop');
}

function stepSim() {
    let result = confirm("実行中の世界を1ステップ進めますか?");
    if(!result) return;
    serverGetReq(function(val) {console.log('step: ' + val);},'step');
}

function resetSim() {
    let result = confirm("実行中の世界を初期化しますか?");
    if(!result) return;
    serverGetReq(function(val) {console.log('reset: ' + val);},'reset');
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
    serverGetReq(getWorldId, "/getWorldId");
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
    return (value) => {
        return func(value, ...arg_arr);
    }
}
function serverGetReq(callback, _req, responseType ='') {
    var req = new XMLHttpRequest();
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
    req.open("POST", action);

    if (type == "form") {
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

