window.onload = function(){
    resetParams();
};
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

//ChromeはJSONを新しいタブで開いても名前をつけてページ保存がで来ないので強制的にダウンロード
function saveParams(formname) {
    let param_dict = form2paramDict(formname);
    let writejson = JSON.stringify(param_dict);
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

function resetParams() {
    serverReq(loadParams, "GET",  "/getParams", responseType='json');
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
function startSim() {
    confirm("現在の設定でシミュレーションを行います．よろしいですか？");
}

function stopSim() {
    confirm("実行中の世界を停止しますか?");
}

function stepSim() {
    confirm("実行中の世界を1ステップ進めますか?");
}

function resetSim() {
    confirm("実行中の世界を初期化しますか?");
}

function loadSimParam(file_input, dict = {}) {
    if(dict != {} ) {
        let form = dict2formdata(dict);
    }
    jsonFile(file_input, loadSimParam);
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
    serverReq(getWorldId, "GET", "/getWorldId");
}
/********************************************
 * 共通
 ***************************************** */
function jsonFile(file_input, callback) {
    var file = file_input.files[0];
    var reader = new FileReader();
    file_input.reset;
    reader.onerror = () => {
        alert("ファイル読み込みに失敗しました．");
    }
    reader.onload = function(e) {
        callback(JSON.parse(reader.result));
    }
    reader.readAsText(file);
}

function syncedServerReq(method, req) {
    var r = new XMLHttpRequest();
    r.open(method, req, false);
    r.send();
    return r.response;
}

function serverReq(callback, method, _req, responseType ='', arg = null) {
    var req = new XMLHttpRequest();
    req.open(method, _req, true);
        req.timeout = 2000;
        if(responseType != ''){
            req.responseType = responseType;
        }
        req.onload = function(){
            let response = req.response;
            if (arg === null)  {
                callback(response);
            }
            else {
                callback(arg, response);
            }

        }
    req.send();
}

function loadFile(file_input, target='') {
    if(target == 'parampanel') {
        jsonFile(file_input, loadParams);
    }
    else if (target == "sim-setting-param") {
        loadSimParam(file_input);
    }
    else if (target == "sim-setting-scenario") {
        jsonFile(file_input, loadSimScenario);
    }
    else {
        alert("何しにきたん？");
    }
}

function dict2formdata(dict) {
    const fd = new Formdata();
    for (key in dict) {
        fd.append(key, dict[key]);
    }
    return fd;
}

function form2paramDict(formname) {
    var types = getParamTypes();
    types = JSON.parse(types);
    var p_dict = {};
    let p_types = types["params"];
    let form_ps = document.forms[formname].elements;

    for(let p in p_types) {
        let type = p_types[p];
        if (type.type != "distribution") {
            p_dict[type.id] = form_ps[type.id].value - 0;
            continue;
        }

        let radio = form_ps.namedItem(type.id);
        p_dict[type.id] = new Array();
        p_dict[type.id].push(radio[0].value - 0);
        p_dict[type.id].push(radio[1].value - 0);
        p_dict[type.id].push(radio[2].value - 0);
    }
    return p_dict;
}

function getParamTypes() {
    return syncedServerReq("GET", "/contents/paramtype.json");
}
