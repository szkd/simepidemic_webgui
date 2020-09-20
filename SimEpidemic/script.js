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
    serverReq(loadParams, "GET",  "contents/defaultparams.json", responseType='json');
}

function loadParams(val_dict) {
    for (let key in val_dict) {
        var element = document.getElementById(key);
        if(typeof(val_dict[key]) == "string") {
            element.value = val_dict[key];
            var view = document.getElementById("view" + key);
            if(view !== null) {
                view.value = val_dict[key];
            }
            continue;
        }
        document.getElementById(element.id + "-min").value = val_dict[key][0]
        document.getElementById(element.id + "-max").value = val_dict[key][1]
        document.getElementById(element.id + "-mode").value = val_dict[key][2]

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
    file_input.value = null;
    reader.onerror = () => {
        alert("ファイル読み込みに失敗しました．");
    }
    reader.onload = function(e) {
        callback(JSON.parse(reader.result));
    }
    reader.readAsText(file);
}

function serverReq(callback, method, _req, responseType ='' ) {
    var req = new XMLHttpRequest();
    req.open(method, _req);
    if(responseType != ''){
        req.responseType = responseType;
    }
    req.send();
    req.onload = function(){
        callback(req.response);
    }
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
    let params = document.forms[formname].elements;
    var param_dict = {};
    for(let elem in params) {
        let name = params[elem].name;
        if(name == '') {
            continue;
        }
        if(param_dict[name] == null) {
            param_dict[name] = params[elem].value;
            continue;
        }
        if(param_dict[name].constructor.name == "Array"){
            param_dict[name].push(params[elem].value);

            continue;
        }
        let value = param_dict[name];
        param_dict[name] = [];
        param_dict[name].push(value);
        param_dict[name].push(params[elem].value);

    }
    return param_dict;
}

