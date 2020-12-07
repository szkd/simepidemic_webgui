/********************************************
 * グローバル
 ***************************************** */
const SEVERNAME = "http://localhost:1234/";
const MONITORS = {};
const ticker = new Worker("../script/TickerWork.js");
function tickerListener(e) {
    console.log(e);
    const cmd = e.data[0];
    switch(cmd) {
        case 'tick':
            updateMonitors();
            console.log("tick: " + e.data[1]);
            postMessage('tack');
            break;
        default:
            console.log('TickerWork Unknown cmd: ' + cmd);
    }
}
ticker.onmessage = tickerListener;

/********************************************
 * 初期化
 ***************************************** */
window.onload = function(){
    if (typeof getBrowserId() === 'undefined') {
        setBrowserId();
    }
    serverGetReq(setHiddenValues, 'getParams', responseType = 'json');
    addMonitor('default');
}

/********************************************
 * パラメータ
 ***************************************** */
/**
 * パラメータパネル(の中のフォーム）の値をJSONファイルにしてユーザーにダウンロード・保存させる
 * @param {string} formname */
function saveForm(formname) {
    let formdata = form2paramDict(formname);
    saveJsonFile(formdata);
}
/**
 * パラメータパネル(の中のフォームのinput）に辞書を反映させる．そのパネルのパラメータ名のリストはHiddenタイプのフォームに保存されているので
 * @param {Object} val_dict - 反映させたい辞書
 * @param {string} formname
 */
function loadParams(val_dict, formname) {
    const formdata = form2paramDict(formname);
    const form = document.forms[formname];
    const param_list = document.getElementById(formname + "-plist").innerText.split(',');
    for(let p of param_list) {
        if(val_dict[p] == null) continue;
        if(val_dict[p].split(',').length > 1) {
            const v = val_dict[p].split(',');
            form[p + "-min"].value = v[0];
            form[p + "-max"].value = v[1];
            form[p + "-mode"].value = v[2];
        }
        form[p].value = val_dict[p];
        const view = document.getElementById("view" + p);
        if(view != null) view.value = val_dict[p];
    }
}

/**
 * パラメータパネル（の中のフォーム）にJSONファイルの値を反映させる
 * @param {Object} file_input
function loadParamsFromFile(file_input, formname) {
    readJsonFile(file_input, function(dict, file) {
        setHiddenValues(dict, 'tmp');
        loadParams(getHiddenValues('tmp'), formname);
    });
}
/**
 * パラメータパネル（の中のフォーム）を(inputの)name:value辞書にして返す．
 * @param {string} formname
 * @return {Object} 辞書
 */
function form2paramDict(formname) {
    const p_list = document.getElementById(formname + "-plist").innerText.split(',');
    const d = getHiddenValues();
    const p_dict = {};
    const form = document.forms[formname];
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

/**
 * パラメータパネル（の中のフォーム）の値を既定値に戻す
 * @param {string} formname
 */
function resetForm(formname) {
    const d = getHiddenValues();
    loadParams(d, formname);
}

/**
 * 全てのパラメータパネル（の中のフォーム)を取得する
 * @return {Array} フォームのリスト
 */
function getParaForms() {
    const para_forms = document.forms['property']['param_formnames'].value.split(',');
    return para_forms;
}

/**
 * 全てのパラメータパネルの値を既定値に戻す
 */
function resetAll() {
    const result = confirm("全てのパラメータをリセットします．");
    if(!result) return;

    const para_forms = getParaForms();
    for (let f of para_forms) {
        resetForm(f);
    }
}

/**
 * 全てのパラメータをJSONファイルとして保存する
 */
function saveAll() {
    const para_forms = getParaForms();
    const p_dict = {};
    for (let f of para_forms) {
        let d = form2paramDict(f);
        p_dict = {...p_dict, ...d};
    }
    saveJsonFile(p_dict);
}

/**
 * JSONファイルから全てのパラメータを設定する
 * @param {Object} file_input - JSONファイル
 */
function loadAll(file_input) {
    const para_forms = getParaForms();
    for (let f of para_forms) {
        loadParamsFromFile(file_input, f);
    }
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

function worldControl(command, world, afterfunc = null) {
    if(world == 'default') {
        world += '&me=' + getBrowserId();
    }
    const req = command + '?world=' + world;
    serverGetReq(function (val) {
        console.log('GET:' + command + ' id: ' + world + ' result:' + val);
        if(afterfunc != null) afterfunc(val);
    }, req);
}

function pauseOrResume(world, button) {
    if(button.innerText == "▶︎") {
        worldControl('start', world);
        MONITORS[world].start();
        button.innerText = "Ⅱ";
    } else {
        worldControl('stop', world);
        MONITORS[world].stop();
        button.innerText = "▶︎";
    }
    return;
}

function stepSim(world, startbtn) {
    startbtn.innerText = "▶︎";
    MONITORS[world].stop();
    worldControl('stop', world);
    worldControl('step', world);
    worldControl('population2', world,
        callbackFunc(
            drawAgents, [MONITORS[world]]
        )
    );
}

function resetSim(world) {
    let result = confirm("実行中の世界を初期化しますか?");
    if(!result) return;
    worldControl('reset', world);
    MONITORS[world].reset();
}

function addMonitor(w_id) {
    const p_node = document.getElementById(w_id + '-result');
    const width = document.querySelector("#world-template .cmd-btn-list").offsetWidth;
    MONITORS[w_id] = new MonitorPIXI(p_node, width, w_id + '-draw-filter');
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

function updateMonitors() {
    const b_id = getBrowserId();
    for(let w_id in MONITORS) {
        const animation = MONITORS[w_id].isAnimate;
        if(animation) {
            serverGetReq(
                callbackFunc(drawAgents, [MONITORS[w_id]]),
                'getPopulation2', {
                    'world': w_id,
                    'me': b_id
            });
        }
    }
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

//image
const trash_box = '<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-trash-fill" fill="currentColor" xmlns="http://www.w3.org/2000/svg">  <path fill-rule="evenodd" d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1H2.5zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5zM8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5zm3 .5a.5.5 0 0 0-1 0v7a.5.5 0 0 0 1 0v-7z"/></svg>';
