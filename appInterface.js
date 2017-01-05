/**
 * @module AppInterface
 * AppInterface 与APP进行交互
 * 支持如下链式操作
 * AppInterface.subscribe('event1',[function1,function2]).subscribe('event2',function(){}).call('query?userId=2',function(){});
 * 修改：subscribe注册的事件，但不再支持call回调使用了，要使用call还请使用匿名回调方法，并且call已经支持超时设置（默认3秒超时）！
 * 修改：支持先notify再subscribe，也进行触发
 * @method AppInterface
 * @author yanglang
 * @date 20160127
 */
(function(window) {
    //typeof define !== 'undefined' ? define('lib/component/appInterface.js',__init):__init(0,{},{});
    __init()

    function __init() {
        var Events = {},
            toBeNotify = [],
            toBeCall = [],
            isCalling = false,
            windowLoaded = false,
            appIframe,
            QUEUE_TIMEOUT = 30, //队列执行间隔时长
            CUSTOM_PROTOCOL_SCHEME = 'appinterface',
            EVENT_PREFIX = 'event'; //临时事件名称前缀，后缀为_+时间缀

        var AppInterface = window.AppInterface = {
            startHashChange: function() {
                type = 'hash';
            },
            stopHashChange: function() {
                type = 'static';
            },
            /**
             * 触发一个事件
             * @method notify
             * @param eventName 事件名称
             * @param data 事件数据 PS：现在支持变参，除了eventName,data以外还可以添加任意参数(修改：取消变参)
             * @returns {AppInterface}
             */
            notify: function(eventName, data) {
                var eventList = Events[eventName],
                    i = 0;
                if (eventList) {
                    var len = eventList.length;
                    for (; i < len; i++) {
                        eventList[i].apply(this, toBeNotify.slice.call(arguments, 1));
                    }
                } else {
                    toBeNotify.push({
                        eventName: eventName,
                        data: toBeNotify.slice.call(arguments, 1),
                        scope: this
                    }); //暂时存入待触发列表
                }
                //若为临时事件，则通知一次之后马上注销
                if (new RegExp('^' + EVENT_PREFIX + '(_\\d+)$').test(eventName))
                    this.unsubscribe(eventName);
                // return this;
                return true;
            },
            /**
             * 给定作用域触发一个事件
             * @param eventName 事件名称
             * @param scope 作用域
             * @param data 事件数据，支持变参
             */
            notifyWith: function(eventName, scope, data) {
                if (arguments.length < 2)
                    throw new TypeError('按作用域触发事件请提供事件名称与作用域');
                this.notify.apply(scope, [eventName].concat(toBeNotify.slice.call(arguments, 2)));
            },
            /**
             * 订阅一个事件
             * @method subscribe
             * @param eventName 事件名称
             * @param callback 事件回调
             */
            subscribe: function(eventName, callback) {
                var i = 0,
                    len = toBeNotify.length;
                if (arguments.length < 2)
                    throw new TypeError('订阅事件请提供事件名称与事件回调');

                var eventList = Events[eventName] ? Events[eventName] : (Events[eventName] = []);
                eventList = Object.prototype.toString.call(callback) === '[object Array]' ? eventList.concat(callback) : eventList.push(callback);
                for (; i < len; i++) {
                    if (toBeNotify[i].eventName === eventName) {
                        //移除并触发之前已准备触发的事件
                        this.notify.apply(toBeNotify[i].scope, [eventName].concat(toBeNotify[i].data));
                        toBeNotify.splice(i, 1);
                        break;
                    }
                }
                return this;
            },
            /**
             * 取消订阅事件
             * @method unsubscribe
             * @param eventName 事件名称
             */
            unsubscribe: function(eventName, callback) {
                if (callback) {
                    var callbacks = Events[eventName];
                    for (var i = 0; i < callbacks.length; i++) {
                        if (callbacks[i] === callback) {
                            callbacks.splice(i--, 1);
                        }
                    }
                } else
                    delete Events[eventName];
                return this;
            },
            /**
             * 列队执行 无参时代表调起队列开始执行
             * @param callback 回调方法
             */
            queue: function(callback) {
                if (arguments.length == 0 && !isCalling) {
                    _reCall();
                    return this;
                }
                if (isCalling || !windowLoaded) {
                    toBeCall.push(callback);
                    return this;
                }

                isCalling = true;
                callback();

                window.setTimeout(_reCall, QUEUE_TIMEOUT);

                function _reCall() {
                  return (function fn(){
                    var flag = false;
                    for (var i = 0; i < toBeCall.length; i++) {
                        flag = true;
                        toBeCall[i].call();
                        window.setTimeout(fn, QUEUE_TIMEOUT);
                        toBeCall.splice(i, 1);
                        break;
                    }
                    isCalling = flag;
                  })
                }
                return this;
            },
            /**
             * 由于内嵌的特殊性，需要代理超链接的默认跳转行为，将此跳转行为用js压入队列实现，否则APP会识别不到同一线程内的别的调用请求
             * @param $dom 可选a标签dom对象，也可以不传，默认代理所有页面内有href值的超链接
             */
            delegateHyperlink: function($dom) {
                var that = this;
                //由于代理了a标签的点击事件，以免影响外部事件顺序，所以不能直接在主线程绑定
                //切入下一线程绑定，预留20ms，不保证外部延迟20ms以上再绑定事件顺序
                window.setTimeout(function() {
                    if ($dom) {
                        $dom.on('click', function(e) {
                            delegate(e, $dom);
                        });
                    } else {
                        $('body').on('click', 'a', function(e) {
                            delegate(e, $(this));
                        });
                    }
                }, 20);

                function delegate(e, $dom) {
                    var _href = $dom.attr('href');
                    if (_href && _href != '#' && !(/^javascript.*$/g).test(_href)) {
                        that.queue(function() {
                            window.location.href = _href;
                        });
                        e.preventDefault();
                    }
                }
                return this;
            },
            /**
             * 调用APP接口，主要是处理参数包，回调等，得到一个url调用doCall方法
             * @method call
             * @param api 请求地址
             * @param params 参数包 可选
             * @param timeout 超时时间 可选 默认为0代表永远不超时
             * @param callback 回调方法 可选
             */
            call: function(api) {
                // if (!this.isMobile) {
                //     (/debug/).test(location.search) && console.log('非移动设备，不执行调用:' + api);
                //     return this;
                // }
                var that = this,
                    callback, url, params, timeout = 0,
                    eventName;
                if (/^\/.*$/.test(api)) {
                    api = api.slice(1);
                }
                switch (arguments.length) {
                    case 0:
                        throw new TypeError('请至少提供一个请求地址参数');
                    case 2:
                        //若参数长度为2，则第二个参数有可能为参数包对象或超时时间或回调方法
                        Type(arguments[1]) == Type.Function ? callback = arguments[1] :
                            Type(arguments[1]) == Type.Number ? timeout = arguments[1] : params = arguments[1];
                        break;
                    case 3:
                        //若参数长度为3，则第二个参数有可能是参数包或超时时间，
                        //第三个参数看情形判断,有可能是超时时间或回调方法
                        Type(arguments[1]) == Type.Number ? timeout = arguments[1] : params = arguments[1];
                        Type(arguments[2]) == Type.Function ? (callback = arguments[2]) :
                            Type(arguments[2]) == Type.Number ? timeout = arguments[2] : '';
                        break;
                    case 4:
                        params = arguments[1];
                        timeout = arguments[2];
                        callback = arguments[3];
                }
                url = CUSTOM_PROTOCOL_SCHEME + '://' + api;
                if (params) {
                    url += (url.indexOf('?') == -1 ? '?' : '&') + function() {
                        var paramArr = [],
                            key;
                        for (key in params) {
                            paramArr.push(key + '=' + (Type(params[key]) == Type.Array ? params[key].join('|') : params[key]));
                        }
                        return paramArr.join('&');
                    }();
                }
                if (callback) {
                    eventName = EVENT_PREFIX + '_' + (new Date()).getTime();
                    this.subscribe(eventName, callback);
                }
                if (eventName) {
                    //url += (url.indexOf('?')==-1?'?':'&')+'jsCallback='+encodeURIComponent("try{window.AppInterface.notify('"+eventName+"',{data});}catch(e){}");
                    url += (url.indexOf('?') == -1 ? '?' : '&') + 'jsFunc=window.AppInterface.notify&jsEvent=' + eventName;
                }
                typeof ApplicationInterface !== 'undefined' ?
                    (function() {
                    //优先使用JsBridge方式进行交互
                    ApplicationInterface.call(url);
                    (/debug/).test(location.search) && console.log(new Date().getTime() + ':JsBridge:AppInterface:' + url);
                })() : (function() {
                    //App尚未提供JsBridge
                    //否则生成iframe通知APP
                    // that.queue(function() {
                        // (/debug/).test(location.search) && console.log(new Date().getTime() + ':Url:AppInterface:' + url);
                        var callOpt = {
                          url: url,
                          protocol: api,
                          params: params,
                          jsFunc: 'window.AppInterface.notify',
                          jsEvent: eventName
                        }
                        doCall(callOpt);
                    // })
                })();

                if (timeout !== 0) {
                    var timer = setTimeout(function() {
                        var endTime = new Date().getTime();
                        //此处针对外部浏览器呼起APP做兼容。非浏览器或非ios9，应该通知  未进入后台，超时等于timeout，也应该通知
                        if (!(endTime - parseInt(eventName.split('_')[1]) > (timeout + 20)) || !(that.isBrowser && that.isIOS9)) {
                            that.notify(eventName, packageData(null, false, '客户端未响应'));
                        }
                        clearTimeout(timer);
                        timer = null;
                    }, timeout);
                }

                return this;
            },
            /**
             * @desc 调用APP打开一个新的webview
             * @method open
             * @param base64Url base64编码后的url
             */
            open: function(base64Url) {
                this.call('/common/localJump', {
                    url: base64Url
                });
            },
            isBrowser: !/gomeplus/g.test(navigator.userAgent),
            isWeiXin: /MicroMessenger/g.test(navigator.userAgent),
            // isIOS9: navigator.userAgent.match(/native_iOS/i),
            isIOS9: (navigator.userAgent.match(/native_iOS/i) || navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPod/i)) && Boolean(navigator.userAgent.match(/OS [9]_\d[_\d]* like Mac OS X/i)),
            // isMobile: /Mobile/g.test(navigator.userAgent),
            isIOS: (navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPod/i))
        };

        //APP内 或 APP外且非IOS9
        if (!AppInterface.isBrowser || (AppInterface.isBrowser && !AppInterface.isIOS9)) {
            //app内直接设置为true不需要缓冲
            windowLoaded = true;
        } else {
            if (document.readyState === 'complete') {
                windowLoaded = true;
            } else {
                window.addEventListener('load', function() {
                    windowLoaded = true;
                    AppInterface.queue();
                });
            }
        }


        /**===================== 适配4个需要调用本地对话框的方法，当在浏览器内调试时使用浏览器自身的对话框，APP内嵌则调用APP的 ==================**/

        var AppAdapter = {
            toast: function(msg, timeout) {
                AppInterface.call('/common/toast', {
                    msg: msg,
                    timeout: timeout ? timeout : 2000
                });
            },
            alert: function(msg, callback) {
                AppInterface.call('/common/alert', {
                    msg: msg
                }, callback);
            },
            prompt: function(msg, content, callback) {
                AppInterface.call('/common/prompt', {
                    msg: msg,
                    content: content
                }, callback);
            },
            confirm: function(msg, callback) {
                var title = '提示',
                    content, callback, args = arguments;
                arguments.length == 2 ? function() {
                    content = args[0];
                    callback = args[1];
                }() : arguments.length == 3 ? function() {
                    title = args[0];
                    content = args[1];
                    callback = args[2];
                }() : content = args[0];
                AppInterface.call('/common/confirm', {
                    msg: content,
                    title: title
                }, callback);
            }
        };
        var BrowserAdpater = {
            toast: function(msg, timeout) {
                var toast = document.createElement('div');
                toast.style.opacity = '0';
                toast.style.padding = '7px 10px';
                toast.style.minWidth = '80px';
                toast.style.color = '#fff';
                toast.style.textAlign = 'center';
                toast.style.position = 'fixed';
                toast.style.bottom = '10%';
                toast.style.left = '50%';
                toast.style.borderRadius = '3px';
                toast.style.fontSize = '14px';
                toast.style.transform = 'translateX(-50%)';
                toast.style.transition = 'opacity .3s ease';
                toast.style.backgroundColor = 'rgba(39, 39, 39, 0.6)';
                toast.innerHTML = '<p>' + msg + '</p>';
                document.body.appendChild(toast);
                setTimeout(function() {
                    toast.style.opacity = '1';
                }, 50);
                setTimeout(function() {
                    toast.style.opacity = '0';
                    setTimeout(function() {
                        document.body.removeChild(toast);
                    }, 300);
                }, timeout ? timeout : 2000);
            },
            alert: function(msg, callback) {
                alert(msg);
                callback && callback(packageData({}, true, ''));
            },
            prompt: function(msg, content, callback) {
                var content = window.prompt(msg, content);
                callback && callback(packageData({
                    content: content,
                    isCancel: content == null
                }, true, ''));
            },
            confirm: function(msg, callback) {
                var title = '提示',
                    content, callback, args = arguments;
                arguments.length == 2 ? function() {
                    content = args[0];
                    callback = args[1];
                }() : arguments.length == 3 ? function() {
                    title = args[0];
                    content = args[1];
                    callback = args[2];
                }() : content = args[0];
                var flag = window.confirm(content);
                callback && callback(packageData({
                    isCancel: !flag
                }, true, ''));
            }
        };

        ['toast', 'alert', 'prompt', 'confirm'].forEach(function(key) {
            AppInterface[key] = function() {
                AppInterface.isBrowser ?
                    BrowserAdpater[key].apply(null, toBeNotify.slice.call(arguments)) :
                    AppAdapter[key].apply(null, toBeNotify.slice.call(arguments));
            };
        });

        function packageData(obj, success, message) {
            return {
                data: obj,
                code: !success & 1,
                message: message,
                success: success
            };
        }

        /**
         * 对象类型获取
         * @method Type
         * @param obj
         * @returns {number}
         * @constructor
         */

        function Type(obj) {
            var type = Object.prototype.toString.call(obj);
            var _type = type.match(/^\[object\s(.*)\]$/)[1];
            return Type[_type] || Type.Object;
        }
        Type.Object = 1;
        Type.Array = 2;
        Type.String = 3;
        Type.Function = 4;
        Type.Number = 5;



        /**
         * 执行app scheme调用
         * 此处要看看是否需要移除iframe，不移除性能会比较好
         * @method doCall
         * @param url
         */

        function doCall(callOpt) {
            console.log(callOpt.url);
            var doc = document,
                body = doc.body,
                message = {
                  protocol:callOpt.protocol,//"isApp/sect"
                  params:callOpt.params,//{msg: 'xxoo'},注意对象属性用驼峰，参数包字段用下划线
                  jsFunc: callOpt.jsFunc,//"window.AppInterface.notify"
                  jsEvent: callOpt.jsEvent//"event_1472625694972"
                };
                console.log(callOpt.jsEvent);
                console.info(callOpt.protocol, callOpt.params)

            // window.webkit.messageHandlers.AppInterface.postMessage(JSON.stringify(message))
            if(window.webkit && window.webkit.messageHandlers){
                //IOS9特殊处理
                window.webkit.messageHandlers.AppInterface.postMessage(JSON.stringify(message))
            } else {
                if(!appIframe){
                    appIframe = doc.createElement('iframe');
                    appIframe.id = 'appInterfaceNativeFrame';
                    appIframe.style.display = 'none';
                    body.appendChild(appIframe);
                }
                //url: "appinterface://isApp/sect?msg=xxoo&jsFunc=window.AppInterface.notify&jsEvent=event_1472625694972"
                appIframe.src = callOpt.url;
            }
        }
    }


})(window);
