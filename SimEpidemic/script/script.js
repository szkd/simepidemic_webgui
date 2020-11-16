/********************************************
 * グローバル
 ***************************************** */
const SEVERNAME = "http://localhost:1234/";
const WORLDLIST = {};

/********************************************
 * 初期化
 ***************************************** */
window.onload = function(){
    if (typeof getBrowserId() === 'undefined') {
        setBrowserId();
    }
    addCanvas('default');
    serverGetReq(setHiddenValues, 'getParams', responseType = 'json');
}

function setBrowserId(storage = localStorage, key = 'simepidemicBrowerID') {
    try {
        let id = new Date();
        id = id.getTime();
        storage.setItem(key, id);
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

function getBrowserId(storage = localStorage, key = 'simepidemicBrowerID') {
    try {
        return storage[key];
    } catch(e) {
        console.log(e);
        alert("ブラウザの設定でlocalStorageを利用可能にしてください．");
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

function convertDict2FakeURL(dict) {
    const writejson = JSON.stringify(dict);
    const blob = new Blob([writejson], {type: 'application/json'});
    return URL.createObjectURL(blob);
}

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

function saveForm(formname) {
    let formdata = form2paramDict(formname);
    saveJsonFile(formdata);
}

function loadParams(val_dict, formname) {
    let formdata = form2paramDict(formname);
    let form = document.forms[formname];
    let param_list = document.getElementById(formname + "-plist").innerText.split(',');
    for(let p of param_list) {
        if(val_dict[p] == null) continue;
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
    let p_dict = {};
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
        alert("Error:");
    };
    req.send();
}

function serverPostReq(callback, action, type, senddata, options={}) {
    let fd = new FormData();
    let req = new XMLHttpRequest();
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
 * パラメータ
 ***************************************** */
function getParaForms() {
    let para_forms = document.forms['property']['param_formnames'].value.split(',');
    return para_forms;
}
function resetAll() {
    let result = confirm("シミュレーションタブの「世界」を含む全てのパラメータをリセットします．");
    if(!result) return;

    let para_forms = getParaForms();
    for (let f of para_forms) {
        resetForm(f);
    }
}
function saveAll() {
    let para_forms = getParaForms();
    let p_dict = {};
    for (let f of para_forms) {
        let d = form2paramDict(f);
        p_dict = {...p_dict, ...d};
    }
    saveJsonFile(p_dict);
}
function loadAll(file_input) {
    let para_forms = getParaForms();
    for (let f of para_forms) {
        loadForm(file_input, f);
    }
}
function sliderValueChanged(slider, outputid){
    let element = document.getElementById(outputid);
    element.value = slider.value;
}

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

/********************************************
 * シミュレーション制御
 ***************************************** */

function setParams(formname, world) {
    const form = document.forms[formname];
    const option = {'world': world, 'me': getBrowserId()};
    if(form['sim-param'].value == 'file') {
        const file = form['sim-param-file'];
        if(!(file.files.length > 0)) {
            console.log("Error: setParams-NoFile");
            console.log(file);
            alert("パラメータのファイルを選択してください．");
            return;
        }
        serverPostReq(function(val) {
            console.log('POST/setParams[file]: ' + val);
        }, 'setParams', 'file', file, option);
        return;
    } else {
        const prop = getHiddenValues('property');
        const forms = prop.param_formnames.split(",");
        let p_dict = {}
        for (let p_form of forms) {
            p_dict = {...p_dict, ...form2paramDict(p_form)};
        }
        serverPostReq(function(val) {
            console.log('POST/setParams[tab]: ' + val);
        }, 'setParams', 'dict', p_dict, option);
        return;
    }
    return;
}

function setScenario(formname, world) {
    const form = document.forms[formname];
    const option = {'world': world, 'me': getBrowserId()};
    if(form['sim-scenario'].value == 'file') {
        let file = form['sim-scenario-file'];
        if(!(file.files.length > 0)) {
            alert("シナリオのファイルを選択してください．");
            return;
        }
        serverPostReq(function(val) {
            console.log('POST/setScenario[file]: ' + val);
        }, 'setScenario', 'file', file, option);
        return;
    } else if(form['sim-scenario'].value == 'disabled') {
        console.log("シナリオなし");
    }
    return;
}

function applySettings(formname, world) {
    setParams(formname, world);
    setScenario(formname, world);
}

function takeSnap(world) {
    const date_time = new Date().getTime();
    const strArray2getURI = (str) =>  {
        const array = str.split(',');
        let uri = "";
        array.forEach(elem => {
            uri += elem + "=1&";
        });
        return uri;
    }
    const filename = (name) => {
        return name + '-' + date_time + '.json';
    }
    const take_snap = (v, name) => {
        return enfocedDownload(
            convertDict2FakeURL(v), filename(name)
        );
    }

    //getPopulation
    serverGetReq(
        callbackFunc(take_snap, ['population']),
        'getPopulation?world=' + world + '&me=' + getBrowserId(),
        responseType = 'json'
    );
    serverGetReq(
        callbackFunc(take_snap, ['population2']),
        'getPopulation2?world=' + world + '&me=' + getBrowserId(),
        responseType = 'json'
    );
    //getIndexes
    const indicator_names = strArray2getURI(
        document.forms['property']['current_step_indicator'].value);
    serverGetReq(
        callbackFunc(take_snap, ['indicators']),
        'getIndexes?' + indicator_names + 'world=' + world + '&me=' + getBrowserId(),
        responseType = 'json'
    );
    const accumulation_indicators = strArray2getURI(
        document.forms['property']['accumulation_indicator'].value);
    serverGetReq(
        callbackFunc(take_snap, ['accum_indicators']),
        'getIndexes?' + accumulation_indicators + 'world=' + world + '&me=' + getBrowserId(),
        responseType = 'json'
    );
    //getDistribution
    const distribution_indicator = strArray2getURI(
        document.forms['property']['distribution_indicators'].value);
    serverGetReq(
        callbackFunc(take_snap, ['distribution_indicators']),
        'getDistribution?' + distribution_indicator + 'fromStep=0&world=' + world + '&me=' + getBrowserId(),
        responseType = 'json'
    );
    //getParams -world
    serverGetReq(
        callbackFunc(take_snap, ['params-' + 'world-' + world]),
        'getParams?world=' + world + '&me=' + getBrowserId(),
        responseType = 'json'
    );
}

function shareDefaultId(id = '') {
    if (id != '') {
        alert("既定世界のIDは "+ id + " です．\nこのIDを共有された人はあなたの既定世界のシミュレーションを閲覧できます．");
        return;
    }
    serverGetReq(shareDefaultId, "getWorldID");
}

function worldControl(command, world, after = null) {
    if(world == 'default') {
        world += '&me=' + getBrowserId();
    }
    const req = command + '?world=' + world;
    serverGetReq(function (val) {
        console.log('GET:' + command + ' id: ' + world + ' result:' + val);
        if(after != null) {
            after(val);
        }
    }, req);
}

function addCanvas(world_id, interval_btn, steps_ps_btn) {
    const canvas = document.getElementById(world_id + '-canvas');
    const width = document.querySelector("#world-template .cmd-btn-list").offsetWidth;
    WORLDLIST[world_id] = new Monitor(
        world_id, getBrowserId(),
        interval_btn, steps_ps_btn,
        canvas, width,
        world_id + "-draw-filter"
    );
}

function deleteCanvas(world_id) {
    WORLDLIST[world_id].finalize();
    WORLDLIST[world_id] = null;
    delete WORLDLIST[world_id];
}

function pauseOrResume(world, button) {
    if(button.innerText == "▶︎") {
        worldControl('start', world, WORLDLIST[world].startMonitor());
        button.innerText = "Ⅱ";
    } else {
        worldControl('stop', world, WORLDLIST[world].stopMonitor());
        button.innerText = "▶︎";
    }
    return;
}

function stepSim(world) {
    worldControl('step', world);
    WORLDLIST[world].step();
}

function resetSim(world) {
    let result = confirm("実行中の世界を初期化しますか?");
    if(!result) return;
    worldControl('reset', world);
    WORLDLIST[world].reset();
}

/********************************************
 * アニメーション設定
 ***************************************** */
function animationFilter(w_id, name, checked) {
    console.log("world id: "+ w_id + "name: " + name + " checked: " + checked);
}

function applyAnimSettings() {
    console.log("applyAnimSettings");
}

/********************************************
 * ワールドリスト
 ***************************************** */
function addNewWorld(world_id='') {
    if(world_id != '') {
        console.log("GET/addNewWorld: " + world_id);
        const w_name = window.prompt("名前を入力してください", "new world");

        const new_world = document.getElementById('world-template').cloneNode(true);
        new_world.style = 'display:block;';
        new_world.id = world_id;
        new_world.querySelector("button[name='share']").remove();
        new_world.querySelector('.world-name-container label').innerText = w_name;

        const delete_sim_btn = document.createElement("button");
        delete_sim_btn.title =  w_name + 'を削除';
        delete_sim_btn.innerHTML = trash_box;
        delete_sim_btn.setAttribute("onclick", "closeWorld('" + world_id + "');");
        delete_sim_btn.setAttribute("class", "command-button");

        new_world.querySelector('.world-name-container').appendChild(delete_sim_btn);
        const interval_btn = new_world.querySelector("input[name='interval']");
        const steps_ps_btn = new_world.querySelector("input[name='speed']");
        new_world.innerHTML = new_world.innerHTML.toString().replace(/default/gi, world_id);

        const w_list = document.getElementById("world-list");
        w_list.append(new_world);

        addCanvas(world_id, interval_btn, steps_ps_btn);
        return;
    }
    console.log("func: addNewWorld");
    serverGetReq(addNewWorld, "newWorld");
}

function closeWorld(world_id){
    const DO = confirm("この世界を消去します．");
    if(!DO) return;

    document.getElementById(world_id).remove();
    deleteCanvas(world_id)
    worldControl('closeWorld', world_id);
}

function sharedWorld() {
    alert("この機能は未実装です");
}

/********************************************
 * ジョブ監視
 ***************************************** */
function getJobQueueStatus(result_view) {
    serverGetReq(function (val) {
        const result = document.getElementById(result_view);
        result.innerText = val;
    }, "getJobQueueStatus");
}

/********************************************
 * サーバーバージョン
 ***************************************** */
function getServerVersion(result_view) {
    serverGetReq(function (val) {
        const result = document.getElementById(result_view);
        result.innerText = val;
    }, "version");
}
/********************************************
 * 共通
 ***************************************** */
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

//image
const trash_box = '<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-trash-fill" fill="currentColor" xmlns="http://www.w3.org/2000/svg">  <path fill-rule="evenodd" d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1H2.5zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5zM8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5zm3 .5a.5.5 0 0 0-1 0v7a.5.5 0 0 0 1 0v-7z"/></svg>';
