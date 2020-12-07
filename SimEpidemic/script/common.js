/********************************************
 * サーバーとの通信
 ***************************************** */
/**
 * 既存関数の一部の引数を指定して新しい関数を作る．
 * @param {Object} func - 既存の関数
 * @param {Object} arg_arr - 指定する引数のリスト（宣言順）
 * @return {Object} 新しい関数
 */
function callbackFunc(func, arg_arr) {
    return function(value) {
        return func(value, ...arg_arr);
    }
}

/**
 * GETリクエスト
 * @param {Object} callback - 関数
 * @param {string} _req - リクエスト文字列, 先頭に「/」をつけない
 * @param {string} [responseType=''] - レスポンスの形式を指定（JSONにすると自動的に辞書に変換される）
 * @return コールバック関数の結果(この関数自身のreturnは無い)
 */
function serverGetReq(callback, _req, responseType ='') {
    _req = SEVERNAME + _req;
    const req = new XMLHttpRequest();
    req.timeout = 3000;
    req.open("GET", _req);
    if(responseType != ''){
        req.responseType = responseType;
    }
    req.onload = function(){
        callback(req.response);
    }
    req.error = function() {
        alert("Error:" + " GET "+_req);
    };
    req.send();
}

/**
 * POSTリクエスト
 * @param {Object} callback - 関数
 * @param {string} action - リクエスト文字列, 先頭に「/」をつけない
 * @param {string} type - 送信データのタイプ．form, dict, fileのどれか
 * @param {Object} senddata - 送信データ
 * @param {Object} [options={}] - value = options[key]，formのname:valueとしてkey:valueを追加する
 * @return (serverPostReqからのもの)可読性のため．実質的には何も返さない
 * @return コールバック関数の結果(この関数からのものではない)
 */
function serverPostReq(callback, action, type, senddata, options={}) {
    let fd = new FormData();
    const req = new XMLHttpRequest();
    req.eroor = function () {
        alert("ERROR:POST " + action);
    }
    req.onload=function() {
        callback(req.response);
    }
    req.open('POST', action);

    function appendDict(dict) {
        for(let key in dict) {
            fd.append(key, dict[key]);
        }
        return fd;
    }
    if(options != {}) {
        appendDict(options);
    }
    if (type == 'form') {
        fd.append(senddata);
        req.send(fd);
        return;
    }
    if (type == 'dict') {
        appendDict(senddata);
        req.send(fd);
        return;
    }
    if(type=="file" && senddata.files.length > 0) {
        const file = senddata.files[0];
        fd.append(file.name, file);
        req.send(fd);
        return;
    }
    if (type=="file") {
        alert('ファイルを選択してください');
        return;
    }
}

/********************************************
 * 共通
 ***************************************** */
/**
 * ブラウザのローカルストレージにブラウザIDを保存する．
 * ローカルストレージが利用できない場合はアラートが出るが，プライベートの場合は警告しない．
 * @param {Object} [storage=localStorage] - 保管場所に利用するストレージのタイプ
 * @param {string} [key='simepidemicBrowerID'] - 参照キー名
 */
function setBrowserId(storage = localStorage, key = 'simepidemicBrowerID') {
    try {
        const id = new Date().getTime();
        storage.setItem(key, id);
    } catch(e) {
        console.log(e);
        alert("ブラウザの設定でlocalStorageを利用可能にしてください．");
    }
}

/**
 * ページに値を保管するフォームを追記する．formnameが衝突した場合は上書きされる．
 * @param {Object} values - 保管したいkey:valueの辞書
 * @param {string} [formname='default_values'] - フォーム名
 */
function setHiddenValues(values, formname = 'default_values') {
    if(document.forms[formname] != undefined) {
        document.forms[formname].remove();
    }
    const f = document.createElement('form');
    f.name = formname;
    f.style = 'display:none;';
    document.body.append(f);
    const field = document.forms[formname];
    for(let name in values) {
        let elem = document.createElement("input");
        elem.type = "hidden";
        elem.name = name;
        elem.value = values[name];
        field.append(elem);
    }
}

/**
 * ブラウザIDを取得する．前回起動時にブラウザがプライベートモードになっていた場合は，新しいブラウザIDになっている．
 * @param {Object} [storage=localStorage] - ストレージのタイプ
 * @param {string} [key = 'simepidemicBrowerID'] - 参照キー．set...のキーと同じにする．
 * @return {string} ブラウザID
 */
function getBrowserId(storage = localStorage, key = 'simepidemicBrowerID') {
    try {
        return storage[key];
    } catch(e) {
        console.log(e);
        alert("ブラウザの設定でlocalStorageを利用可能にしてください．");
    }
}

/**
 * フォームに保管された値を取り出す
 * @param {string} [formname='default_values']
 * return {Object} key:valueの辞書，見つけられなかった場合は空辞書{}を返す
 */
function getHiddenValues(formname = 'default_values') {
    const d = Array.from(document.forms[formname].children);
    const dict = {};

    if (d == null || d == undefined) return {};
    for (let i in d) {
        dict[d[i].name] = d[i].value;
    }
    return dict;
}

/**
 * 辞書オブジェクトをJSONファイルにしてダウンロードURLを作成する
 * @param {Object} - JSONファイルでダウンロードしたい辞書
 * @return {string} URL
 */
function convertDict2FakeURL(dict) {
    const writejson = JSON.stringify(dict);
    const blob = new Blob([writejson], {type: 'application/json'});
    const fake = URL.createObjectURL(blob);
    console.log('convertDict2FakeURL: return type ');
    console.log(typeof fake);
    return fake;
}

/**
 * 辞書をファイルにしてユーザーにダウンロード・保存させる．Firefox, Safariの場合は新規ウインドウに表示させてファイル名を指定して保存するよう促す．
 * @param {Object} val - ダウンロードさせたい辞書
 */
function saveJsonFile(val) {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const fakeurl = convertDict2FakeURL(val);

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

/**
 * スライダーの値を表示する
 * @param {Object} slider - スライダーinput
 * @param {string} outputid - 値を表示するノードのID
 */
function sliderValueChanged(slider, outputid){
    const element = document.getElementById(outputid);
    element.value = slider.value;
}

/**
 * ファイルをダウンロードさせる
 * @param {string} url - ファイルのURL
 * @param {string} [filename=''] - 保存時のファイルの名前
 */
function enfocedDownload(url, filename = '') {
    if(filename == '') {
        filename = window.prompt("ファイル名を入力してください．", "my.json");
    }
    let a = document.createElement("a");
    a.href = url
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
}

function loadFile(file_input) {
    readJsonFile(file_input, function (result, file) {
        let filename = file_input.previousSibling;
        filename.innerText = "";
        filename.innerText = " " + file.name;
    });
}

function dict2formdata(dict) {
    let fd = new FormData();
    for (key in dict) {
        fd.append(key, dict[key]);
    }
    return fd;
}

function showElement(id) {
    document.getElementById(id).style.display = "block";
}

function hideElement(id) {
    document.getElementById(id).style.display = 'none';
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
