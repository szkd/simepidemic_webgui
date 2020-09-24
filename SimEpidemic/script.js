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


function form2paramDict(formname, p_types) {
    p_types = JSON.parse(p_types);
    var p_dict = {};
    let form_ps = document.forms[formname].elements;
    for(let id in p_types) {
        let type = p_types[id].type;
        if (type != "distribution") {
            p_dict[id] = form_ps[id].value - 0;
            continue;
        }

        let radio = form_ps.namedItem(id);
        p_dict[id] = new Array();
        p_dict[id].push(radio[0].value - 0);
        p_dict[id].push(radio[1].value - 0);
        p_dict[id].push(radio[2].value - 0);
    }
    return saveJsonFile(p_dict);
}


//ChromeはJSONを新しいタブで開いても名前をつけてページ保存がで来ないので強制的にダウンロード
function saveParams(formname) {
    var callback = callbackFunc(form2paramDict, formname);
    serverGetReq(callback, "/contents/paramtype.json");
}

function resetParams() {
    serverGetReq(loadParams, "/getParams", responseType='json');
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
function startSim(formname) {
    let result = confirm("現在の設定でシミュレーションを行います．よろしいですか？");
    if(!result) return;

}

function stopSim() {
    let result = confirm("実行中の世界を停止しますか?");
    if(!result) return;
}

function stepSim() {
    let result = confirm("実行中の世界を1ステップ進めますか?");
    if(!result) return;
}

function resetSim() {
    confirm("実行中の世界を初期化しますか?");
    if(!result) return;
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

function serverGetReq(callback, _req, responseType ='') {
    var req = new XMLHttpRequest();
    req.open("GET", _req);
        req.timeout = 2000;
        if(responseType != ''){
            req.responseType = responseType;
        }
        req.onload = function(){
            let response = req.response;
                callback(response);
        }
    req.send();
}

function loadFile(file_input, target='') {
    if(target == 'parampanel') {
        readJsonFile(file_input, loadParams);
    }
    else if (target == "sim-setting-param" || target == "sim-setting-scenario") {
        readJsonFile(file_input, function (_, file) {
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

function callbackFunc(func, arg_arr) {
    return (value) => {
        return func(value, ...arg_arr);
    }
}

function saveJsonFile(dict) {
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
