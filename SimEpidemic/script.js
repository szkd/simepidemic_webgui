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
    var req = new XMLHttpRequest();
    req.open('GET', 'contents/defaultparams.json');
    req.responseType = 'json';
    req.send();
    req.onload = function(){
        loadParams(req.response);
    }
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
function loadParamFile(file_input, target='') {
    if(target == 'parampanel') {
        jsonFile(file_input, loadParams);
    }
    else {
        alert("何しにきたん？");
    }
}
/********************************************
 * シミュレーション制御
 ***************************************** */
function startSim() {
    confirm("現在の設定でシミュレーションを行います．よろしいですか？");
}
/********************************************
 * 共通
 ***************************************** */
function jsonFile(file_input, callback) {
    const file = file_input.files[0];
    const reader = new FileReader();
    reader.onerror = () => {
        alert("ファイル読み込みに失敗しました．");
    }
    reader.onload = () => {
        callback(JSON.parse(reader.result));
    }
    reader.readAsText(file);
}
