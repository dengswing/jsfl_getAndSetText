fl.outputPanel.clear();
var oStr=new Object();
var iIndex=0;

var folderURI=fl.browseForFolderURL("选择需要导出静态文字的fla文件的文件夹位置：");

var sData = FLfile.read(folderURI+"/text.json");
if (sData) {
	fl.trace("read json = "+sData);
	oStr = parse(String(sData));
}

var fileMask="*.fla";
var folderContents=FLfile.listFolder(folderURI + "/" + fileMask,"files");
var outFolder = folderURI + "/export/";

if (folderContents) {
    for (var i=0; i < folderContents.length; ++i) {
        var thisFile=folderURI + "/" + folderContents[i];
		
		if(!FLfile.exists(outFolder))
		{
			FLfile.createFolder(outFolder);				
		}
		
		var sPath=outFolder+"/"+folderContents[i];
		FLfile.copy(thisFile,sPath);
		if (fl.openDocument(sPath)) {
			paresFile();			
		}
    }
}

function paresFile()
{
	var document = flash.getDocumentDOM();
	var items = document.library.items;
	var length = items.length;

	var item;
	var list = new Array();
	for(var i = 0;i < length;i++)
	{
		item = items[i];
		if(!item.linkageClassName || item.itemType == "folder") continue;
	   
		list.push(item.name + ", " + item.linkageClassName);
		//flash.trace("item.itemType="+item);
		
		document.library.selectItem(item.name);
		document.library.editItem();
		editLayer(document);
	}

	document.save();
	document.close();
}

function editLayer(doc)
{
	var timeline = doc.getTimeline();
	for (var i = timeline.layers.length - 1; i >= 0; i--)
	{
		var layer = timeline.layers[i];
		for (var j = 0, totalFrames = layer.frames.length; j < totalFrames; j++)
		{
			var frame = layer.frames[j];
			if(j == frame.startFrame)
			{
				for(var k=0,len = frame.elements.length;k<len;k++)
				{
					var element = frame.elements[k];
					getElement(element);
				}
			}
		}
	}	
}

function getElement(element)
{
	if(element.elementType=="instance")
	{
		document.library.selectItem(element.libraryItem.name);
		document.library.editItem();
		editLayer(document);								
	} else if(element.elementType=="shape" && element.isGroup)
	{
		var shapesArray = element.members; 
		  for (var i=0; i<shapesArray.length; i++) { 
			 getElement(shapesArray[i]);		
		  }		
	}
	else if(element.elementType !="text" || element.textType!="static")
	{
		
	}else
	{	
	
		var sValue=element.getTextString();	
		if (cutOut(sValue))
		{
			var nValue= replaceText(sValue,oStr);					
			if(nValue !=undefined)
			{				
			  element.setTextString(nValue);
			 // fl.trace("success = " + nValue+"||" + element.getTextString());	
			}else{
				fl.trace("error = "+sValue)	
			}
		}
	}
}


fl.trace("set finish");


function replaceText(sVal,oData)
{	
	/*var reg = new RegExp( "\{"+"[0-9]"+"\}", "ig" );
	var iIndex= reg.exec(sVal);
	reg = new RegExp("[0-9]", "ig" );
    iIndex= reg.exec(iIndex);*/
	//fl.trace("iIndex = "+iIndex)	
	var old=sVal;
	var iIndex = sVal.substring(sVal.indexOf("@&")+2,sVal.length);
	//fl.trace("iIndex = "+iIndex+" ==>"+oData[iIndex]+" old="+old)	
	return oData[iIndex];
}

function cutOut(sValue)
{
	//var reg = new RegExp( "\{"+"[0-9]"+"\}", "ig" );
	//return reg.test(sValue);
	return sValue.indexOf("@&") !=-1;
}

var ch = '';
var at = 0;
var t,u;
var text;

function stringify(arg) {

	var c, i, l, s = '', v;

	switch (typeof arg) {
	case 'object':
		if (arg) {
			if (arg instanceof Array) {
				for (i = 0; i < arg.length; ++i) {
					v = stringify(arg[i]);
					if (s) {
						s += ',';
					}
					s += v;
				}
				return '[' + s + ']';
			} else if (typeof arg.toString != 'undefined') {
				for (i in arg) {
					v = arg[i];
					if (typeof v != 'undefined' && typeof v != 'function') {
						v = stringify(v);
						if (s) {
							s += ',';
						}
						s += stringify(i) + ':' + v;
					}
				}
				return '{' + s + '}';
			}
		}
		return 'null';
	case 'number':
		return isFinite(arg) ? String(arg) : 'null';
	case 'string':
		l = arg.length;
		s = '"';
		for (i = 0; i < l; i += 1) {
			c = arg.charAt(i);
			if (c >= ' ') {
				if (c == '\\' || c == '"') {
					s += '\\';
				}
				s += c;
			} else {
				switch (c) {
					case '\b':
						s += '\\b';
						break;
					case '\f':
						s += '\\f';
						break;
					case '\n':
						s += '\\n';
						break;
					case '\r':
						s += '\\r';
						break;
					case '\t':
						s += '\\t';
						break;
					default:
						c = c.charCodeAt();
						s += '\\u00' + Math.floor(c / 16).toString(16) +
							(c % 16).toString(16);
				}
			}
		}
		return s + '"';
	case 'boolean':
		return String(arg);
	default:
		return 'null';
	}
}
function white() {
	while (ch) {
		if (ch <= ' ') {
			next();
		} else if (ch == '/') {
			switch (next()) {
				case '/':
					while (next() && ch != '\n' && ch != '\r') {}
					break;
				case '*':
					next();
					for (;;) {
						if (ch) {
							if (ch == '*') {
								if (next() == '/') {
									next();
									break;
								}
							} else {
								next();
							}
						} else {
							error("Unterminated comment");
						}
					}
					break;
				default:
					error("Syntax error");
			}
		} else {
			break;
		}
	}
}

function error(m) {
	throw {
		name: 'JSONError',
		message: m,
		at: at - 1,
		text: text
	};
}
function next() {
	ch = text.charAt(at);
	at += 1;
	return ch;
}
function str() {
	var i, s = '', t, u;
	var outer = false;

	if (ch == '"') {
		while (next()) {
			if (ch == '"') {
				next();
				return s;
			} else if (ch == '\\') {
				switch (next()) {
				case 'b':
					s += '\b';
					break;
				case 'f':
					s += '\f';
					break;
				case 'n':
					s += '\n';
					break;
				case 'r':
					s += '\r';
					break;
				case 't':
					s += '\t';
					break;
				case 'u':
					u = 0;
					for (i = 0; i < 4; i += 1) {
						t = parseInt(next(), 16);
						if (!isFinite(t)) {
							outer = true;
							break;
						}
						u = u * 16 + t;
					}
					if(outer) {
						outer = false;
						break;
					}
					s += String.fromCharCode(u);
					break;
				default:
					s += ch;
				}
			} else {
				s += ch;
			}
		}
	}
	error("Bad string");
}

function arr() {
	var a = [];

	if (ch == '[') {
		next();
		white();
		if (ch == ']') {
			next();
			return a;
		}
		while (ch) {
			a.push(value());
			white();
			if (ch == ']') {
				next();
				return a;
			} else if (ch != ',') {
				break;
			}
			next();
			white();
		}
	}
	error("Bad array");
}

function obj() {
	var k, o = {};

	if (ch == '{') {
		next();
		white();
		if (ch == '}') {
			next();
			return o;
		}
		while (ch) {
			k = str();
			white();
			if (ch != ':') {
				break;
			}
			next();
			o[k] = value();
			white();
			if (ch == '}') {
				next();
				return o;
			} else if (ch != ',') {
				break;
			}
			next();
			white();
		}
	}
	error("Bad object");
}

function num() {
	var n = '', v;

	if (ch == '-') {
		n = '-';
		next();
	}
	while (ch >= '0' && ch <= '9') {
		n += ch;
		next();
	}
	if (ch == '.') {
		n += '.';
		next();
		while (ch >= '0' && ch <= '9') {
			n += ch;
			next();
		}
	}
	if (ch == 'e' || ch == 'E') {
		n += ch;
		next();
		if (ch == '-' || ch == '+') {
			n += ch;
			next();
		}
		while (ch >= '0' && ch <= '9') {
			n += ch;
			next();
		}
	}
	v = Number(n);
	if (!isFinite(v)) {
		error("Bad number");
	}
	return v;
}

function word() {
	switch (ch) {
		case 't':
			if (next() == 'r' && next() == 'u' &&
					next() == 'e') {
				next();
				return true;
			}
			break;
		case 'f':
			if (next() == 'a' && next() == 'l' &&
					next() == 's' && next() == 'e') {
				next();
				return false;
			}
			break;
		case 'n':
			if (next() == 'u' && next() == 'l' &&
					next() == 'l') {
				next();
				return null;
			}
			break;
	}
	error("Syntax error");
}

function value() {
	white();
	switch (ch) {
		case '{':
			return obj();
		case '[':
			return arr();
		case '"':
			return str();
		case '-':
			return num();
		default:
			return ch >= '0' && ch <= '9' ? num() : word();
	}
}
function parse(_text) {
	text = _text;
		at = 0;
	ch = ' ';
	return value();
}