/**
 * 初期化 window.onload
 */
window.onload = function(){
    if (typeof tool.getBrowserId() === 'undefined') {
        tool.setBrowserId();
    }
    server.get(tool.setHiddenValues, 'getParams', responseType = 'json');
    addMonitor('default');
}

/**
 * リサイズ window.resize
 */
window.addEventListener('resize', function () {
    const width = draw.getCanvasParentWidth();
    const height = draw.height(width);
    for(w_id in MONITORS) {
        MONITORS[w_id].resize(width, height);
    }
});

/********************************************
 ***************************************** */
/**
 * パラメータ
 * @namespace
 */
const param = {};
/**
 * パラメータパネル（の中のフォーム）を(inputの)name:value辞書にして返す．
 * @param {string} formname
 * @return {object} - パラメータID:値の辞書
 */
param.form2dict = function(formname) {
    const p_list = document.getElementById(formname + "-plist").innerText.split(',');
    const d = tool.getHiddenValues();
    //console.log(d);
    //console.log(p_list);
    const p_dict = {};
    const form = document.forms[formname];
    for(let p of p_list) {
        //console.log(p);
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
 * パラメータパネル(の中のフォーム）の値をJSONファイルにしてユーザーにダウンロード・保存させる
 * @param {string} formname
 */
param.download = function(formname) {
    const formdata = param.form2dict(formname);
    tool.saveJsonFile(formdata);
}
/**
 * パラメータパネル(の中のフォームのinput）に辞書を反映させる．そのパネルのパラメータ名のリストはHiddenタイプのフォームに保存されているので
 * @param {object} val_dict - 反映させたい辞書
 * @param {string} formname - 対象のパラメータパネル
 */
param.load = function(val_dict, formname) {
    const formdata = param.form2dict(formname);
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
 * @param {object:input} file_input
 * @param {string} formname - 分類とフォームが１対１になっている
 */
param.loadFromFile = function(file_input, formname) {
    tool.readJsonFile(file_input, function(dict, file) {
        tool.setHiddenValues(dict, 'tmp');
        param.load(tool.getHiddenValues('tmp'), formname);
    });
}

/**
 * パラメータパネル（の中のフォーム）の値を既定値に戻す
 * @param {string} formname
 */
param.resetForm = function(formname) {
    const d = tool.getHiddenValues();
    param.load(d, formname);
}
/**
 * 全てのパラメータパネル（の中のフォーム)を取得する
 * @return {object:array} フォームのリスト
 */
param.getParamForms = function() {
    const para_forms = document.forms['property']['param_formnames'].value.split(',');
    return para_forms;
}
/**
 * 全てのパラメータパネルの値を既定値に戻す
 */
param.resetAll =  function() {
    const result = confirm(msg.resetAll[LANGUAGE]);
    if(!result) return;

    const para_forms = param.getParamForms();
    for (let f of para_forms) {
        resetForm(f);
    }
}
/**
 * 全てのパラメータをJSONファイルとして保存する
 */
param.saveAll = function() {
    const para_forms = param.getParamForms();
    let p_dict = {};
    for (let f of para_forms) {
        let d = param.form2dict(f);
        p_dict = {...p_dict, ...d};
    }
    tool.saveJsonFile(p_dict);
}
/**
 * JSONファイルから全ての分類のパラメータを設定する
 * 発火：input(file) onchange
 * @param {object:input} file_input - JSONファイル
 */
param.loadAll = function(file_input) {
    const para_forms = param.getParamForms();
    for (let f of para_forms) {
        param.loadFromFile(file_input, f);
    }
}

/********************************************
 ***************************************** */
/**
 * シミュレーション制御
 * @namespace
 */
const sim = {};
/**
 * パラメータを設定
 * @param {string} formname - 適用したいパラメータ情報
 * @param {string} world - ワールドID
 */
sim.setParams = function(formname, world) {
    const form = document.forms[formname];
    const option = {'world': world, 'me': tool.getBrowserId()};
    if(form['sim-param'].value == 'file') {
        const file = form['sim-param-file'];
        if(!(file.files.length > 0)) {
            console.log("Error: setParams-NoFile");
            console.log(file);
            alert(msg.selectParamFile[LANGUAGE]);
            return;
        }
        server.post(function(val) {
            console.log('POST/setParams[file]: ' + val);
        }, 'setParams', 'file', file, option);
        return;
    } else {
        const prop = tool.getHiddenValues('property');
        const forms = prop.param_formnames.split(",");
        let p_dict = {}
        for (let p_form of forms) {
            p_dict = {...p_dict, ...param.form2dict(p_form)};
        }
        server.post(function(val) {
            console.log('POST/setParams[tab]: ' + val);
        }, 'setParams', 'dict', p_dict, option);
        return;
    }
    return;
}
/**
 * シナリオを設定
 * @param {string} formname - 適用したいパラメータ情報
 * @param {string} world - ワールドID
 */
sim.setScenario =  function(formname, world) {
    const form = document.forms[formname];
    const option = {'world': world, 'me': tool.getBrowserId()};
    if(form['sim-scenario'].value == 'file') {
        let file = form['sim-scenario-file'];
        if(!(file.files.length > 0)) {
            alert(msg.selectScenarioFile[LANGUAGE]);
            return;
        }
        server.post(function(val) {
            console.log('POST/setScenario[file]: ' + val);
        }, 'setScenario', 'file', file, option);
        return;
    } else if(form['sim-scenario'].value == 'disabled') {
        console.log("シナリオなし");
    }
    return;
}
/**
 * シミュレーションに設定を適用する
 * @param {string} formname - 適用したいパラメータ情報
 * @param {string} world - ワールドID
 */
sim.applySettings = function (formname, world) {
    sim.setParams(formname, world);
    sim.setScenario(formname, world);
}
/**
 * その瞬間に取得できるデータを取得する
 * @param {string} world - ワールドID
 */
sim.takeSnap = function(world) {
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
        return tool.enfocedDownload(
            tool.convertDict2FakeURL(v), filename(name)
        );
    }

    //getPopulation
    server.get(
        tool.callbackFunc(take_snap, ['population']),
        'getPopulation?world=' + world + '&me=' + tool.getBrowserId(),
        responseType = 'json'
    );
    server.get(
        tool.callbackFunc(take_snap, ['population2']),
        'getPopulation2?world=' + world + '&me=' + tool.getBrowserId(),
        responseType = 'json'
    );
    //getIndexes
    const indicator_names = strArray2getURI(
        document.forms['property']['current_step_indicator'].value);
    server.get(
        tool.callbackFunc(take_snap, ['indicators']),
        'getIndexes?' + indicator_names + 'world=' + world + '&me=' + tool.getBrowserId(),
        responseType = 'json'
    );
    const accumulation_indicators = strArray2getURI(
        document.forms['property']['accumulation_indicator'].value);
    server.get(
        tool.callbackFunc(take_snap, ['accum_indicators']),
        'getIndexes?' + accumulation_indicators + 'world=' + world + '&me=' + tool.getBrowserId(),
        responseType = 'json'
    );
    //getDistribution
    const distribution_indicator = strArray2getURI(
        document.forms['property']['distribution_indicators'].value);
    server.get(
        tool.callbackFunc(take_snap, ['distribution_indicators']),
        'getDistribution?' + distribution_indicator + 'fromStep=0&world=' + world + '&me=' + tool.getBrowserId(),
        responseType = 'json'
    );
    //getParams -world
    server.get(
        tool.callbackFunc(take_snap, ['params-' + 'world-' + world]),
        'getParams?world=' + world + '&me=' + tool.getBrowserId(),
        responseType = 'json'
    );
}
/**
 * 既定世界のIDを取得する
 * @param {string} [id=''] - server.getのcallbackに同じ関数を指定するため．idを代入して使うことはない
 */
sim.shareDefaultId = function(id = '') {
    if (id != '') {
        alert(msg.defaultId[LANGUAGE](id));
    }
    else {
        server.get(sim.shareDefaultId, "getWorldID");
    }
}
/**
 * シミュレーション世界
 * @param {string} command - シミュレーションに適用するコマンド
 * @param {string} world - 世界ID
 * @param {object:function} [afterfunc=null] - callbackとして使いたい関数がある場合は指定できる
 */
sim.worldControl = function(command, world, afterfunc = null) {
    if(world == 'default') {
        world += '&me=' + tool.getBrowserId();
    }
    const req = command + '?world=' + world;
    server.get(function (val) {
        console.log('GET:' + command + ' id: ' + world + ' result:' + val);
        if(afterfunc != null) afterfunc(val);
    }, req);
}

/**
 * GUI操作
 * @namespace
 */
const gui = {};
gui.worldGui = function(world_id, title, shared=false) {
    const new_world = document.getElementById('world-template').cloneNode(true);

    new_world.style = 'display:block;';
    new_world.id = world_id;
    new_world.querySelector("button[name='simswitch']").innerText = '▶︎';
    new_world.querySelector("button[name='share']").remove();
    new_world.querySelector('.world-name-container label').innerText = title;

    const delete_sim_btn = document.createElement("button");
    delete_sim_btn.innerHTML = img.trash_box;
    delete_sim_btn.setAttribute("onclick", "closeWorld('" + world_id + "'," + shared + ");");
    delete_sim_btn.setAttribute("class", "command-button");

    new_world.querySelector('.world-name-container').appendChild(delete_sim_btn);
    new_world.innerHTML = new_world.innerHTML.toString().replace(/default/gi, world_id);

    const w_list = document.getElementById("world-list");
    w_list.append(new_world);
    addMonitor(world_id);
    if(shared) {
        new_world.querySelector("div.owner-only").remove();
        function isRunning(bool) {
            if(bool) return;
            alert(msg.warning.notRunning[LANGUAGE]);
            closeWorld(world_id, true);
        }
        server.get(isRunning, 'getIndexes?isRunning=1');
    }
}

gui.addNewWorld = function (world_id = '') {
    if(world_id != '') {
        console.log("GET/addNewWorld: " + world_id);
        const w_name = window.prompt(msg.requestWorldName[LANGUAGE], "new world");
        gui.worldGui(world_id, w_name);
        return;
    }
    console.log("func: addNewWorld");
    server.get(gui.addNewWorld, "newWorld");
}

gui.addSharedWorld = function () {
    const input_str = window.prompt(msg.requestSharedId[LANGUAGE]);
    if(input_str == "" || input_str == null || input_str == undefined) {
        alert(msg.warning.sharedIdNull[LANGUAGE]);
        return;
    }
    const shared_id = input_str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(s) {
        return String.fromCharCode(s.charCodeAt(0) - 65248);
    });
    gui.worldGui(shared_id, 'Shared World:' + shared_id, true);
    MONITORS[shared_id].start(tool.getBrowserId(), shared_id);
}

gui.deleteSharedWorld = function (w_id) {
}

function addMonitor(w_id) {
    const p_node = document.getElementById(w_id + '-result');
    p_node.innerHTML='';
    const width = document.querySelector("#world-template .cmd-btn-list").offsetWidth;
    MONITORS[w_id] = new MonitorPIXI(p_node, width, w_id);
}


