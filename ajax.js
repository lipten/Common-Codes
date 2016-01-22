//=========私有方法===========
    var utils = {
        defaultOption :{
            data : "",  // json or string
            method : "POST",
            receiveType : "html",  // html json or xml
            async : true,
            success : function(){alert("define your success function");},
            error : function(xmlhttp){}
        },
        config : {
            '_curd': 'get,add,edit,del',
            '_mul': 'query,muladd,muldel,muledit',
            '_normal': 'get,query,add,edit,del',
        },

        //========通用方法===========
        // 对象继承方法
        extend : function(destination, source, override) {
            if(undefined == override) override = true;
            if(typeof destination != "object" && typeof destination != "function") {
                if(!override)
                    return destination;
                else
                    destination = {};
            }
            var property = '';
            for(property in source) {
                if(override || !(property in destination)) {
                    destination[property] = source[property];
                }
            }

            return destination;
        },


        // 判断数组
        isArray : function(v) {
            return toString.apply(v) === '[object Array]';
        },


        // json to string {name: 'lisi', age: 10} --> name=lisi&age=10
        json2String : function(jsonData) {
            var strArr = [];
            for(var k in jsonData) {
                strArr.push(k + "=" + jsonData[k]);
            }

            return strArr.join("&");
        },


        //=========Ajax方法==========
        // 初始化xmlhttpRequest
        init : function() {
            var xmlhttp = null;

            // 针对不同浏览器建立这个对象的不同方式写不同代码
            if(window.XMLHttpRequest) {
                xmlhttp = new XMLHttpRequest();
                //针对某些特定版本的Mozillar浏览器的BUG进行修正
                if(xmlhttp.overrideMimeType) {
                    xmlhttp.overrideMimeType("text/xml");
                }

            } else if (window.ActiveXObject) {
                var activexName = ['MSXML2.XMLHTTP', 'Microsoft.XMLHTTP'];
                for (var i=0; i<activexName.length; i++) {
                    try {
                        xmlhttp = new ActiveXObject(activexName[i]);
                        break;
                    } catch(e) {}
                }
            }
            return xmlhttp;
        },

        // 发送http 请求
        ajax : function(opt) {
            this.xmlhttp = utils.init()
            var _self = this,
                isTimeout = false,
                options = {
                    url : "",   // string
                    data : "",  // json or string
                    method : "POST",
                    receiveType : "html",  // html json or xml
                    timeout : 7000,
                    async : true,
                    success : function(){alert("define your success function");},
                    error : function(xmlhttp){}
                };
            if("data" in opt) {
                if(typeof opt.data == "string"){} else {opt.data = this.json2String(opt.data); }
            }
            options = this.extend(options, opt);

            this.xmlhttp.onreadystatechange = function(){
                if(_self.xmlhttp.readyState == 4) {
                    if(!isTimeout && _self.xmlhttp.status == 200) {
                        var t = options.receiveType.toLowerCase();
                        if(t == "html") {
                            options.success(_self.xmlhttp.responseText);

                        } else if(t == "xml") {
                            options.success(_self.xmlhttp.responseXML);

                        } else if(t == 'json') {
                            try {
                                var obj = JSON.parse(_self.xmlhttp.responseText);
                                options.success(obj);
                            } catch(e) {
                                var str = '(' + _self.xmlhttp.responseText + ')';  //json字符串
                                options.success(eval(str));
                            }
                        } else {}

                    } else {
                        options.error(_self.xmlhttp);
                    }
                }
            };



            this.xmlhttp.open(options.method.toUpperCase(), options.url, options.async);  //打开与服务器连接
            if(options.method.toUpperCase() == "POST") {
                this.xmlhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');  //post方式要设置请求类型
                this.xmlhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');  //post方式要设置请求类型
                this.xmlhttp.send(options.data);  //发送内容到服务器

            } else {
                this.xmlhttp.send(null);
            }
        },
    }