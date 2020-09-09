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
""" ****************************** 
partial
********************************* """
def paramSlider(param):
    param['min'] = param['min'] if 'min' in param else '0'
    param['max'] = param['max'] if 'max' in param else '100'
    param['value'] = param['default'] if 'default' in param else '50'
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

    html_str = tag("div", num(values[0], "最小値", "_min", unit), {'class': 'dist-item'})
    html_str += tag("div", num(values[1], "最大値", "_max", unit), {'class': 'dist-item'})
    html_str += tag("div", num(values[2], "最頻値", "_mode", unit), {'class': 'dist-item'})
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
        html+= tag("script", '', {'href':script})
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
tab
********************************* """
def tabItemContainer(tab_items, container_id):
    return tag("div", tab_items, {'class' : 'tab_container', 'id' : container_id})

def addTab(tabname, id, name, tab_container_id, content, checked=''):
    suffix = '_content'
    style = "<style>"\
        + "#" + id + suffix +"{display: none;}"\
        + "#" + id + ":checked ~ #" + id + suffix\
        + "{display: block;}"
    style += "#" + id + ":checked + ." + "tab_item" + "{"\
        + "background-color: white;"\
        + "color: var(--my-black);"\
        + "border: none;"\
        + "}"
    style += "</style>"
    tab = tag("input", attr={'type':'radio', 'class' : 'tab_checkbox', 'id': id, 'name': name, 'checked': 'checked'}, end=False)
    tab += tag("label", tabname, {'for':id, 'class': 'tab_item'})
    tabcontent = tag("div",content, {'class': 'tab_content', 'id' : id+suffix})
    return {'tab_item': style + tab, 'tab_content': tabcontent}

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
    if 'min' not in attr:
        attr['min'] = '0'
    if 'max' not in attr:
        attr['max'] = '100'

    html = tag("span", attr['min'])
    html += tag("input", attr=attr, end=False)
    html += tag("span", attr['max'])
    html += tag("span",\
            attr['value'],\
            {'class': 'slider_value'});
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
            html_str += " " + key + " = '" + attr_dict[key] + "'"
    return html_str

""" ******************************
build
******************************** """
data = {}
data["HEAD"] = head("SimEpidemic", stylesheets=["css/common.css"])
data["HEADER"] = header(CONTENTS_DIR + "info.json")
panels = paramPanel(TEMPLATE_DIR + 'param_template.json')
tab1 = addTab('パラメータ', 'id', 'page_tabs', 'tabs', panels, 'checked')
tab2 = addTab('tabname2', 'id2', 'page_tabs', 'tabs', 'content2')
tabitems = tab1['tab_item'] + tab2["tab_item"]
tab_contents = tab1["tab_content"] + tab2["tab_content"]
data["MAIN"] = tabItemContainer(tabitems + tab_contents, 'tabs')
data["MAIN"] += tab1["tab_content"] + tab2["tab_content"]
with open(OUTPUT_DIR + "index.html", mode="w") as f:
    f.write(rephrase(TEMPLATE_DIR + "base.html", data))

