import json
import os
import shutil
from collections import OrderedDict
""" ********************************
const
******************************** """
TEMPLATE_DIR = "templates/"
OUTPUT_DIR = "SimEpidemic/"
CONTENTS_DIR = OUTPUT_DIR + "contents/"
SIM_DIR = TEMPLATE_DIR + "sim/"
PARAM_DIR = TEMPLATE_DIR + "param/"
COMMON_DIR = TEMPLATE_DIR + "common/"
SCENARIO_DIR = TEMPLATE_DIR + "scenario/"
""" ******************************
image
********************************* """
settings_icon = "url(\"data:image/svg+xml;charset=UTF-8,<svg width='1em' height='1em' viewBox='0 0 16 16' class='bi bi-gear-fill' fill='white' xmlns='http://www.w3.org/2000/svg'>  <path fill-rule='evenodd' d='M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 0 0-5.86 2.929 2.929 0 0 0 0 5.858z'/></svg>\");"

""" ********************************
common
******************************** """
def buttonGroupFromJson(jsonfile):
    html_str=""
    json = json2dict(jsonfile, True)
    info = json['info']
    listener = json['listener']
    buttons = json['buttons']
    other = json['other'] if 'other' in json else ''

    for cmd in buttons:
        html_str += tag("button", buttons[cmd], {\
                "class": info['cmd_cls'],\
                "onclick": listener[cmd]\
                })
    for key in other:
        cmd = other[key]
        content = cmd['content'] if 'content' in cmd else ''
        attr = cmd['attr']
        html_str += tag(cmd['tag'], content, cmd['attr'], cmd['end'])

    html_str = tag("div", html_str, {\
            'class': info['cmd_list_cls']\
            })
    return html_str

""" ********************************
pages
******************************** """
def simSettings():
    template  = json2dict(CONTENTS_DIR + "sim_settings.json")
    sections = template['sections']
    info = template['info']
    html_str = ""
    for sec in sections:
        section = sections[sec]
        section_label = tag("div", section['label'], {"class": info['title_cls']})
        input_str = ""
        options = section['options']
        idx = -1
        for opt in section['options']:
            idx += 1
            attr = {\
                "type": section['type'],\
                "name": section['name'],\
                "id": sec + str(idx)
                }
            if 'checked' in opt:
                attr['checked'] = "checked"

            option = tag("input", attr=attr,end = False)
            label = tag("label", opt['label'], {"for": sec + str(idx), "style": "margin-right:  8px;"})
            if 'file' in opt:
                f_id = 'file'+ sec + str(idx)
                info['file-attr']['id'] = f_id
                info['file-attr']['onchange'] = opt['onchange']
                label += tag("label", '', {"for": f_id, "class": "file-plus"})
                label += tag("input", attr=info['file-attr'], end=False)
                label += tag("span", '', {"id": f_id + "result"})
            input_str += tag("span", option + label, {"class": info['option-cls'], "style": info['option-style']});
        input_str = tag("div", input_str, {"class": info['option-container']})
        html_str += tag("div", section_label + input_str)
    return html_str

def sim():
    commands = buttonGroupFromJson(SIM_DIR + "view.json")
    commands += buttonGroupFromJson(SIM_DIR + "commands.json")
    info = json2dict(CONTENTS_DIR + "sim_settings.json")
    info = info['info']
    html = panel(info['formname'], "設定", simSettings(),\
            icon_normal = settings_icon,\
            icon_checked = settings_icon)

    html += commands
    return html

""" ********************************* """
""" ********************************* """
def param():
    commands = buttonGroupFromJson(PARAM_DIR + "commands.json");
    info = json2dict(PARAM_DIR + "commands.json")['info']
    params = ""
    params += paramPanels(PARAM_DIR + 'param.json', COMMON_DIR + 'panel.html')
    params = tag("form", params, {"name": info['formname']})
    return commands + params

""" ********************************* """
""" ********************************* """
def scenario():
    panels = paramPanels(SCENARIO_DIR + "scenario.json", COMMON_DIR + 'panel.html')
    return panels;
""" ********************************* """
""" ********************************* """
def statistics():
    return 'statistics'

""" ****************************** 
page function
********************************* """
PAGE_FUNC = {}
PAGE_FUNC["sim"] = sim
PAGE_FUNC["param"] = param
PAGE_FUNC["scenario"] = scenario
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
    for_id = param['id']
    label = tag("label", param['description'], {'for': for_id, 'class': 'num-label'})
    unit = tag("span", param['unit'] if 'unit' in param else '')
    del param['description'], param['unit']
    param['class'] = "param-input"
    numbox = tag("input", attr=param, end=False)
    return tag("div", label + numbox + unit, {'class': 'param-num'})

def paramDistribution(param):
    rep_dict = {
            'ID': param["id"],
            'TITLE': param["description"],
            'VALUE-MIN': param['value'][0],
            'VALUE-MAX': param['value'][1],
            'VALUE-MODE': param['value'][2],
            'UNIT': tag("span", param['unit']) if 'unit' in param else ""
            }
    return rephrase(PARAM_DIR + "distribution.html", rep_dict, 1000)

def panel(id, title, content, myclass='', icon_normal = '"▶︎"', icon_checked = '"▼"'):
    template_html = COMMON_DIR + "panel.html"
    attr = {}
    attr['ID'] = id
    attr['PANEL-TITLE'] = title
    attr['PANEL-CONTENT'] = content
    attr['CLASS'] = myclass
    attr['ICON-NORMAL'] = icon_normal
    attr['ICON-CHECKED'] = icon_checked
    return rephrase(template_html, attr, 1000);

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
                pid = param['id']
                params += paramDistribution(param)
            else:
                params += '謎のふぉーむ: ' + param['type']
        checkbox_id = 'checkbox-' + param['id']
        panels += panel(checkbox_id,  panel_title, params)
    return tag("div", panels, {'class': 'panels'})

def head(title, stylesheets=[], scripts=[]):
    html = tag("title", title)\
            + tag("meta", attr={'charset': 'utf-8'}, end = False)\
            + tag("link", attr = {'rel': 'icon', 'href': 'favicon.png'}, end = False)
    for stylesheet in stylesheets:
        html += tag("link", attr={'rel': 'stylesheet', 'href': stylesheet}, end=False)
    for script in scripts:
        html+= tag("script", '', {'src':script})
    return html;

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

    return rephrase(COMMON_DIR + "header.html", data)

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
    if 'id' not in attr:
        return 'error'
    if 'step' not in attr:
        return 'error'
    if 'min' not in attr:
        attr['min'] = '0'
    if 'max' not in attr:
        attr['max'] = '100'
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
    style = tag("style", rephrase(COMMON_DIR + "tab_style.css", {'ID': id}, 100))
    return {'tab_item': style + tab, 'tab_content': tabcontent}

""" ******************************
build
******************************** """
data = {}
data["HEAD"] = head("SimEpidemic", stylesheets=["css/common.css"], scripts=["script.js"])
data["HEADER"] = header(CONTENTS_DIR + "info.json")
tablist = json2dict(COMMON_DIR + "tabs.json", ordered = True)
tab_items = ""
tab_contents = ""
for key in tablist:
    checked = False if 'checked' not in tablist[key] else True
    tab = addTab(tablist[key]["tabname"], key, 'page_tab', PAGE_FUNC[key], checked)
    tab_items += tab['tab_item']
    tab_contents += tab['tab_content']

data["MAIN"] = tabItemContainer(tab_items + tab_contents,'tabs')
with open(OUTPUT_DIR + "index.html", mode="w") as f:
    f.write(rephrase(COMMON_DIR + "base.html", data))
