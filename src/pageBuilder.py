import json
import os
import shutil
from collections import OrderedDict
""" ********************************
const
******************************** """
TEMPLATE_DIR = "templates/"
JSON_DIR = "json/"
OUTPUT_DIR = "../SimEpidemic/"
""" OUTPUT """


""" ******************************
content
********************************* """
""" ****************************** 
partial
********************************* """
def head(title, stylesheets=[], scripts=[]):
    html = "<head><title>" + title + "</title>"\
            + "<meta charset='utf-8'>"
    for stylesheet in stylesheets:
        html +="<link rel='stylesheet' href='"\
               + stylesheet + "'>"
    for script in scripts:
        html+="<script href='"\
                + script + "'></script>"
    html+="</head>"
    return html

def header(jsonfile):
    html = "<header class='suns-serif'>"
    data = json2dict(jsonfile)
    data["SIGNATURE"] = \
            a(data["SIGNATURE"]["link"],\
            data["SIGNATURE"]["name"])
    data["DESCRIPTION"] = \
            data["DESCRIPTION"]["description"]\
            + a(data["DESCRIPTION"]["project-link"],\
            data["DESCRIPTION"]["project"],\
            target='_blank')

    html += h1(data["TITLE"])\
            + input('checkbox', id='info-checkbox')\
            + label('', 'info-checkbox', myclass= 'info', title="これは何?")\
            + p(data["DESCRIPTION"], myclass='panel suns-serif', id='info-panel')
    html += div(\
            span("ver." + data["VERSION"], myclass="info-item")\
            + span("更新日: " + data["UPDATE"], myclass="info-item")\
            + span(data["SIGNATURE"], myclass="info-item"),\
            )
    html+= "</header>"
    return html

def tabItemContainer(tab_items, container_id):
    return div(tab_items, myclass='tab_container', id=container_id)

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
        #+ "background-color: rgba(10, 10, 10, 80%);"
    style += "</style>"
    tab = input('radio', myclass='tab_checkbox', id=id, name=name, checked = checked)
    tab += label(tabname, id, myclass='tab_item')
    tabcontent = div(content, myclass='tab_content', id=id+suffix)
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
def rephrase(template_file, data_dict):
    template_str = ""
    with open(template_file) as f:
        template_str = f.read()

    for key in data_dict:
        template_str = template_str.replace(key, data_dict[key], 1)
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
def h1(content, myclass='', id=''):
    attr_dict = {
            'class': myclass,
            'id': id
            }
    return "<h1" + attributes(attr_dict) + ">" + content + "</h1>"

def slider(id, name,\
        value = '50', min = '0', max='100',\
        step='1', unit=''\
        ):
    attr_dict={
        'value': value,
        'min': min,
        'max': max,
        'step': step
    }
    html = label(name, id);
    html += "<input type='range'"\
            + attributes(attr_dict)
    html += span(value, myclass='slider_value')
    if unit != '':
        html += span(unit, myclass='slider_unit')
    return html

def input (type, myclass='', id='', name='', checked=''):
    html_str = "<input type='" + type + "'"
    attr_dict = {
            'class': myclass,
            'id' : id,
            'name' : name,
            'checked': checked
            }
    html_str += attributes(attr_dict)
    html_str += ">"
    return html_str

def label(label_str, for_id, myclass='', id='', title=''):
    attr_dict = {
            'for': for_id,
            'class': myclass,
            'id': id,
            'title': title
            }
    html =  "<label" + attributes(attr_dict) + ">"
    html += label_str + "</label>"
    return html

# ex {'class' : 'float', 'id': 'myid'}
def attributes(attr_dict):
    html_str = ""
    for key in attr_dict:
        if attr_dict[key] != '':
            html_str += ' ' + key + " = " + attr_dict[key]
    return html_str

def div(content, myclass='', id=''):
    html_str = "<div"
    attr = {
            'class': myclass,
            'id': id
            }
    html_str += attributes(attr)
    html_str += ">" + content  + "</div>"
    return html_str

def a(url, description, myclass='', id='', target=''):
    html_str = "<a"
    attr = {
            'href': url,
            'class': myclass,
            'id': id,
            'target': target
            }
    html_str += attributes(attr)
    html_str += ">" + description + "</a>"
    return html_str

def button(title, myclass='', id =''):
    html_str = "<button"
    attr = {
            'class': myclass,
            'id': id
            }
    html_str += attributes(attr);
    return html_str + ">" + title + "</button>"

def span(content, myclass="", id=""):
    html_str = "<span"
    attr = {
            'class': myclass,
            'id': id
            }
    html_str += attributes(attr);
    return html_str + ">" + content + "</span>"

def p(content, myclass='', id=''):
    attr = {
            'class': myclass,
            'id': id
            }
    html_str = "<p" + attributes(attr) + ">"
    html_str += content;
    html_str += "</p>"
    return html_str
""" ******************************
build
******************************** """
makedirs(OUTPUT_DIR, fource=True);
data = {}
data["HEAD"] = head("SimEpidemic", stylesheets=["../css/common.css"])
data["HEADER"] = header(JSON_DIR + "info.json")
tab1 = addTab('tabname', 'id', 'page_tabs', 'tabs', 'content')
tab2 = addTab('tabname2', 'id2', 'page_tabs', 'tabs', 'content2', 'checked')
tabitems = tab1['tab_item'] + tab2["tab_item"]
tab_contents = tab1["tab_content"] + tab2["tab_content"]
data["MAIN"] = tabItemContainer(tabitems + tab_contents, 'tabs')
data["MAIN"] += tab1["tab_content"] + tab2["tab_content"]
data["MAIN"] += div(slider('sample', 'さんぷる', unit='サンプル'));
with open(OUTPUT_DIR + "index.html", mode="w") as f:
    f.write(rephrase(TEMPLATE_DIR + "base.html", data))
