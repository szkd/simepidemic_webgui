import json
import os
import shutil
from collections import OrderedDict
""" ********************************
const
******************************** """
TEMPLATE_DIR = "templates/"
CONTENTS_DIR = "contents/"
OUTPUT_DIR = "SimEpidemic/"
""" ******************************
content
********************************* """
def sim():
    command = { "start": "開始", "stop": "停止", "step": "1ステップ進む", "reset": "初期化"}
    html=""
    for key in command:
        html += tag("button",command[key], {'class': 'command-button', 'type': 'submit', 'formaction' : key})
    html = tag("form", html, {'class': 'cmd-btn-list', 'method': 'get', 'target': 'result'})
    return html

""" ********************************* """
""" ********************************* """
param_formname = 'param-form'
defaults_formname = 'defaults'
def param():
    commander = {\
            "save": {\
                "title": "現在の設定を保存",\
                'onclick': "saveParams('" + param_formname + "')"},\
            "reset": {\
                "title": "既定値に戻す",\
                "onclick": "resetParams('" + defaults_formname + "', '" + param_formname + "')"\
                }\
            }

    commands = ""
    params = ""
    for command in commander:
        c = commander[command]
        title = c["title"]
        del c["title"]
        c["class"] = 'command-button'
        commands += tag("button", title, c)
    commands = tag("div", commands, {'class': 'cmd-btn-list'})
    params += paramPanels(TEMPLATE_DIR + 'param.json', TEMPLATE_DIR + 'param-panel.html')
    p_form = tag("form", params, {'name': param_formname});
    d_form = tag("form", params, {'name': defaults_formname, 'style': 'display:none;'});
    return commands + p_form + d_form

def statistics():
    return 'statistics'

""" ****************************** 
page function
********************************* """
PAGE_FUNC = {}
PAGE_FUNC["sim"] = sim
PAGE_FUNC["param"] = param
PAGE_FUNC["statistics"] = statistics
""" ****************************** 
partial
********************************* """
def paramSlider(param):
    param['min'] = param['min'] if 'min' in param else '0'
    param['max'] = param['max'] if 'max' in param else '100'
    param['value'] = param['value'] if 'value' in param else '50'
    unit = param['unit'] if 'unit' in param else ''
    description = param['description'] if 'description' in param else '謎のパラメータ'
    description = tag("div", description, {"class": 'param-title'})
    del param['unit'],  param['description']
    return slider(description, param, unit = unit)

def paramNumber(param):
    for_id = param['name']
    label = tag("label", param['description'], {'for': for_id, 'class': 'num-label'})
    unit = tag("span", param['unit'] if 'unit' in param else '')
    del param['description'], param['unit']
    param['class'] = "param-input"
    numbox = tag("input", attr=param, end=False)
    return tag("div", label + numbox + unit, {'class': 'param-num'})

def paramDistribution(param):
    param["type"] = "number"
    values = param['value']
    unit = param['unit'] if 'unit' in param else ''
    title = param['description']
    del param['description'], param['unit']

    def num(value, labelname, suffix, unit) :
        param['id'] = param['name'] + suffix
        param['value'] = value
        input_str = tag("label", labelname, {'for' : param['id']})\
                + tag("input", attr=param)+ tag("span", unit) if unit != '' else ''
        return  tag("div", input_str, {'class': 'dist-num'})

    html_str = tag("div", num(values[0], "最小値", "-min", unit), {'class': 'dist-item'})
    html_str += tag("div", num(values[1], "最大値", "-max", unit), {'class': 'dist-item'})
    html_str += tag("div", num(values[2], "最頻値", "-mode", unit), {'class': 'dist-item'})
    title = tag("div", title, {'class': 'param-title'})
    html_str = tag("div", html_str, {'class': 'dist-input'})

    return tag("div", title + html_str, {'class': 'param_dist'})

def paramPanels(jsonfile,template_html):
    categories = json2dict(jsonfile)
    panels =""
    for category in categories:
        c = categories[category]
        paramlist = c['param-list']
        panel_title = c['name'] if 'name' in c else 'カテゴリ名前がない!'
        params = ""
        for param in paramlist:
            if param['type'] == 'range':
                params += paramSlider(param)
            elif param['type'] == 'number':
                params += paramNumber(param)
            elif param['type'] == 'distribution':
                params += paramDistribution(param)
            else:
                params += '謎のふぉーむ: ' + param['type']
        checkbox_id = 'checkbox-' + param['name']
        panels += rephrase(template_html, {'ID': checkbox_id, 'PANEL-TITLE': panel_title, 'PANEL-CONTENT': params}, 1000)
    return tag("div", panels, {'class': 'panels'})

def head(title, stylesheets=[], scripts=[]):
    html = tag("title", title)\
            + tag("meta", attr={'charset': 'utf-8'}, end = False)
    for stylesheet in stylesheets:
        html += tag("link", attr={'rel': 'stylesheet', 'href': stylesheet}, end=False)
    for script in scripts:
        html+= tag("script", '', {'src':script})
    return tag("head", html)

def header(jsonfile):
    data = json2dict(jsonfile)
    data["SIGNATURE"] = tag("a", data["SIGNATURE"]["name"],\
                        {'href' : data["SIGNATURE"]["link"]})

    data["DESCRIPTION"] = \
            data["DESCRIPTION"]["description"]\
            + tag("a",\
            data["DESCRIPTION"]["project"],\
            {'href' : data["DESCRIPTION"]["project-link"],\
            'target' : '_blank'})

    return rephrase(TEMPLATE_DIR + "header.html", data)


""" ******************************
json
********************************* """
def json2dict(filename, ordered=False):
    json_str = ""
    with open(filename) as f:
        json_str = f.read()
    if ordered:
        return json.loads(json_str, object_pairs_hook=OrderedDict)
    return json.loads(json_str)

""" ******************************
tools
********************************* """
def rephrase(template_file, data_dict, count=1):
    template_str = ""
    with open(template_file) as f:
        template_str = f.read()

    for key in data_dict:
        template_str = template_str.replace(key, data_dict[key], count)
    return template_str

def makedirs(path, fource = False):
    if not os.path.isdir(path):
        os.makedirs(path)
    elif fource:
        shutil.rmtree(path)
        os.makedirs(path)
    else:
        return

""" ******************************
html parts
********************************* """
def slider( label, attr, unit=''):
    attr['type'] = 'range'
    if 'value' not in attr:
        return 'error'
    if 'name' not in attr:
        return 'error'
    if 'step' not in attr:
        return 'error'
    if 'min' not in attr:
        attr['min'] = '0'
    if 'max' not in attr:
        attr['max'] = '100'
    if 'id' not in attr:
        attr['id'] = 'slider_' +  attr['name'] + attr['value']
    prefix='view'
    attr['oninput'] = 'sliderValueChanged(this.value,' + "\'" + prefix + attr['id'] +"\'" + ')'
    html = tag("span", attr['min'])
    html += tag("input", attr=attr, end=False)
    html += tag("span", attr['max'])
    html += tag("input", attr={'type': 'number', 'step': attr['step'],\
            'value': attr['value'], 'class': 'slider_value', 'id': prefix + attr['id'],\
            'oninput': 'sliderValueChanged(this.value, ' + "\'" + attr['id'] + "\'" + ')'},\
            end= False)
    if unit != '':
        html += tag("span", unit, {'class': 'slider_unit'})
    slider_input = tag("div", html, {'class': 'slider'})
    return tag("div", label + slider_input)

def tag(tagname, content = '', attr={}, end=True):
    html_str = "<" + tagname + attributes(attr) + ">"
    if end:
        html_str += content
        html_str += "</" + tagname +">"
    return html_str

# ex {'class' : 'float', 'id': 'myid'}
def attributes(attr_dict):
    html_str = ""
    for key in attr_dict:
        if attr_dict[key] != '':
            html_str += ' ' + key + ' = "' + attr_dict[key] + '"'
    return html_str
""" ****************************** 
tab
********************************* """
def tabItemContainer(tab_items, container_id, myclass = 'tab_container'):
    return tag("div", tab_items, {'class' : myclass, 'id' : container_id})

def addTab(tabname, id, name, c_func, checked=False):
    attr={
            'type':'radio',
            'id': id,
            'name': name,
            'style': 'display:none;'
            }
    if checked:
        attr['checked'] = 'checked'
    tab = tag("input",attr= attr, end=False)
    tab += tag("label", tabname, {'for':id, 'class': 'tab_item'})
    tabcontent = tag("div", c_func(), {'class': 'tab_content', 'id': id + '_content'})
    style = tag("style", rephrase(TEMPLATE_DIR + "tab_style.css", {'ID': id}, 100))
    return {'tab_item': style + tab, 'tab_content': tabcontent}

""" ******************************
build
******************************** """
data = {}
data["HEAD"] = head("SimEpidemic", stylesheets=["css/common.css"], scripts=["script.js"])
data["HEADER"] = header(CONTENTS_DIR + "info.json")
tablist = json2dict(TEMPLATE_DIR + "tabs.json", ordered = True)
tab_items = ""
tab_contents = ""
for key in tablist:
    checked = False if 'checked' not in tablist[key] else True
    tab = addTab(tablist[key]["tabname"], key, 'page_tab', PAGE_FUNC[key], checked)
    tab_items += tab['tab_item']
    tab_contents += tab['tab_content']

data["MAIN"] = tabItemContainer(tab_items + tab_contents,'tabs')
with open(OUTPUT_DIR + "index.html", mode="w") as f:
    f.write(rephrase(TEMPLATE_DIR + "base.html", data))
