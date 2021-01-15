/**
 * サーバーとの通信
 * @namespace
 */
const server = {};
/**
 * GETリクエスト
 * @param {object:function} callback - 関数
 * @param {string} _req - リクエスト文字列, 先頭に「/」をつけない
 * @param {string} [responseType=''] - レスポンスの形式を指定（JSONにすると自動的に辞書に変換される）
 * @return コールバック関数の結果(この関数自身のreturnは無い)
 */
server.get = function(callback, _req, responseType ='') {
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
    req.error = function() { alert("Error:" + " GET "+_req);
    };
    req.send();
}
/**
 * POSTリクエスト
 * @param {object:function} callback - 関数
 * @param {string} action - リクエスト文字列, 先頭に「/」をつけない
 * @param {string} type - 送信データのタイプ．form, dict, fileのどれか
 * @param {object:node:form} senddata - 送信データ
 * @param {object:dict} [options={}] - value = options[key]，formのname:valueとしてkey:valueを追加する
 * @return (serverPostReqからのもの)可読性のため．実質的には何も返さない
 * @return コールバック関数の結果(この関数からのものではない)
 */
server.post = function(callback, action, type, senddata, options={}, w_id='') {
    let fd = new FormData();
    const req = new XMLHttpRequest();
    req.eroor = function () {
        alert("ERROR:POST " + action);
    }
    req.onload=function() {
        callback(req.response);
    }
    req.open('POST', SEVERNAME + action);

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
        fd.append(w_id, file);
        req.send(fd);
        return;
    }
    if (type=="file") {
        alert('ファイルを選択してください');
        return;
    }
}
server.version = function(result_view) {
    server.get(function (val) {
        const result = document.getElementById(result_view);
        console.log(result);
        result.innerText = val;
    }, "version");
};
server.jobQueStatus = function (result_view) {
    this.get(function (val) {
        const result = document.getElementById(result_view);
        result.innerText = val;
    }, "getJobQueueStatus");
};
/********************************************
 ***************************************** */
/**
 * 共通ツール
 * @namespace
 */
const tool = {};
/**
 * ファイルをダウンロードさせる
 * @param {string} url - ファイルのURL
 * @param {string} [filename=''] - 保存時のファイルの名前
 */
tool.enfocedDownload = function(url, filename = '') {
    if(filename == '') {
        filename = window.prompt("ファイル名を入力してください．", "my.json");
    }
    let a = document.createElement("a");
    a.href = url
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
}
/**
 * JSONファイルを読み込み，結果をcallback関数に渡す
 * @param {object} file_input - input type='file'
 * @param {object:function} callback - 文字列とファイルオブジェクトを引数にとる関数
 */
tool.readJsonFile = function(file_input, callback) {
    const file = file_input.files[0];
    const reader = new FileReader();
    file_input.reset;
    reader.onerror = () => {
        alert("ファイル読み込みに失敗しました．");
    }
    reader.onload = function(e) {
        callback(JSON.parse(reader.result), file);
    }
    reader.readAsText(file);
}
/**
 * ブラウザのローカルストレージにブラウザIDを保存する．
 * ローカルストレージが利用できない場合はアラートが出るが，プライベートの場合は警告しない．
 * @param {object} [storage=localStorage] - 保管場所に利用するストレージのタイプ
 * @param {string} [key='simepidemicBrowerID'] - 参照キー名
 */
tool.setBrowserId = function (storage = localStorage, key = 'simepidemicBrowerID') {
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
 * @param {object} values - 保管したいkey:valueの辞書
 * @param {string} [formname='default_values'] - フォーム名
 */
tool.setHiddenValues = function(values, formname = 'default_values') {
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
 * @param {object} [storage=localStorage] - ストレージのタイプ
 * @param {string} [key = 'simepidemicBrowerID'] - 参照キー．set...のキーと同じにする．
 * @return {string} ブラウザID
 */
tool.getBrowserId = function(storage = localStorage, key = 'simepidemicBrowerID') {
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
 * @return {object:dict} key:valueの辞書，見つけられなかった場合は空辞書{}を返す
 */
tool.getHiddenValues = function(formname = 'default_values') {
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
 * @param {object} - JSONファイルでダウンロードしたい辞書
 * @return {string} URL
 */
tool.convertDict2FakeURL = function(dict) {
    const writejson = JSON.stringify(dict);
    const blob = new Blob([writejson], {type: 'application/json'});
    const fake = URL.createObjectURL(blob);
    return fake;
}
/**
 * 辞書をファイルにしてユーザーにダウンロード・保存させる．Firefox, Safariの場合は新規ウインドウに表示させてファイル名を指定して保存するよう促す．
 * @param {object} val - ダウンロードさせたい辞書
 */
tool.saveJsonFile = function(val) {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const fakeurl = tool.convertDict2FakeURL(val);

    if(userAgent.indexOf('msie') != -1
        || userAgent.indexOf('edge') != -1
        || userAgent.indexOf('chrome') != -1) {
        tool.enfocedDownload(fakeurl);
    }
    else if(userAgent.indexOf('safari') != -1
        || userAgent.indexOf('firefox') != -1) {
        alert("新しいタブでJSONファイルを開きます．\nFirefoxをお使いの方は左上の保存ボタン，Safariをお使いの方は右クリック→ページを別名で保存，を使って保存してください．");
        window.open(fakeurl);
    } else {
        tool.enfocedDownload(fakeurl);
    }
}
/**
 * 読み込んだファイルの名前を表示する
 * 発火：input(file) onchange
 * @param {object:input} file_input
 */
tool.displayFilename = function(file_input) {
    tool.readJsonFile(file_input, function (result, file) {
        const filename = file_input.previousSibling;
        filename.innerText = "";
        filename.innerText = " " + file.name;
    });
}
/**
 * 辞書からFormDataを作る
 * @param {object} 辞書
 * @return {object} FormData
 */
tool.dict2formdata = function(dict) {
    const fd = new FormData();
    for (key in dict) {
        fd.append(key, dict[key]);
    }
    return fd;
}
/**
 * 既存関数の一部の引数を指定して新しい関数を作る．
 * @param {object:function} func - 既存の関数
 * @param {object:array} arg_arr - 指定する引数のリスト（宣言順）
 * @return {object:function} 新しい関数
 */
tool.callbackFunc = function(func, arg_arr) {
    return function(value) {
        return func(value, ...arg_arr);
    }
}
/**
 * 指定した要素の可視/不可視をスイッチする
 * @param {string} id - スイッチ対象のエレメントID
 */
tool.switchVisible = function(id, visible) {
    const e = document.getElementById(id);
    if(visible) {
        e.style.visibility = 'visible';
        e.style.display = 'block';
    }
    else {
        e.style.visibility = 'hidden';
        e.style.display = 'none';
    }
}

/********************************************
 ***************************************** */
/**
 * 画像
 * @namespace
 */
const img = {
    /**
     * ゴミ箱
     */
    trash_box: '<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-trash-fill" fill="currentColor" xmlns="http://www.w3.org/2000/svg">  <path fill-rule="evenodd" d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1H2.5zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5zM8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5zm3 .5a.5.5 0 0 0-1 0v7a.5.5 0 0 0 1 0v-7z"/></svg>'
}

/********************************************
 ***************************************** */
/**
 * 日英それぞれのメッセージ，になる予定
 * @namespace
 */
const msg = {
    /**
     * script.js: param.resetAll
     */
    resetAll: {
        "JA": "全てのパラメータをリセットします．",
        "EN": "全てのパラメータをリセットします．"
    },
    /**
     * script.js: sim.setParams
     */
    resetAll: {
        "JA": "全てのパラメータをリセットします．",
        "EN": "全てのパラメータをリセットします．"
    },
    /**
     * script.js: sim.setParams
     */
    selectParamFile: {
        "JA": "パラメータのファイルを選択してください．",
        "EN": "パラメータのファイルを選択してください．"
    },
    /**
     * script.js: sim.setScenario
     */
    selectScenarioFile: {
        "JA": "シナリオのファイルを選択してください．",
        "EN": "シナリオのファイルを選択してください．"
    },
    /**
     * script.js: sim.shareDefaultId
     */
    defaultId: {
        "JA": function (id) {
            return "既定世界のIDは "+ id + " です．\nこのIDを共有された人はあなたの既定世界のシミュレーションを閲覧できます．";
        },
        "EN": function (id) {
            return "既定世界のIDは "+ id + " です．\nこのIDを共有された人はあなたの既定世界のシミュレーションを閲覧できます．";
        }
    },
    /**
     * script.js: function resetSim
     */
    confirmResetWorld: {
        "JA": "実行中の世界を初期化しますか?",
        "EN": "実行中の世界を初期化しますか?"
    },
    /**
     * script.js: function closeWorld
     */
    confirmCloseWorld: {
        "JA": "この世界を消去します．",
        "EN": "この世界を消去します．"
    },
    requestSharedId: {
        "JA": "共有された世界IDを入力してください．",
        "EN": "共有された世界IDを入力してください．"
    }
}
