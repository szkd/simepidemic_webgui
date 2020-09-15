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

/** 仮置き，サーバーからGETでデフォルト値を設定したJsonFileを読み込む方が良い
 * もしくは当初の予定通りhiddenにしたデフォ値のフォームを複製するか？
 * */
function getDefaultParams() {
    /*
     * var req = new SMLHttpRequest();
     * req.open('GET', 'contents/defaultparams.json');
     * req.responseType = 'json';
     * req.send();
     * req.onload = function(){
     *  return req.response;
     *  }
     *  */
    let default_vals = {
        "populationSize":"10000",
        "worldSize":"360",
        "mesh":"18",
        "stepsPerDay":"4",
        "initialInfected":"4",
        "infectionProberbility":"50.0",
        "infectionDistance":"4.0",
        "incubation":["1.0", "14.0","5.0"],
        "fatality":["4.0","20.0","16.0"],
        "recovery":["4.0","40.0","10.0"],
        "immunity":["30.0","360.0","180.0"],
        "distancingStrength":"50.0",
        "distancingObedience":"20.0",
        "mobilityFrequency":"50.0",
        "mobilityDistance":["10.0","80.0","30.0"],
        "contactTracing":"20.0",
        "testDelay":"1.0",
        "testProcess":"1.0",
        "testInterval":"2.0",
        "testSensitivity":"70.0",
        "testSpecificity":"99.8",
        "subjectAsymptomatic":"1.0",
        "subjectSymptomatic":"99.0"
    };
    return default_vals;
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
function resetParams(param_formname) {
    let val_dict = getDefaultParams();
    loadParams(val_dict);
}
