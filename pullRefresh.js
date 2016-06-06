/**
 * Created by lipten on 2016/6/3.
 */
define([],function(_){
    var pullRefresh = function (option) {

        var self = this;

        self.container = option.container || ''
        self.url = option.url || ''


        var obj = document.querySelector(self.container);

        /*插入下拉刷新元素*/
        var loading = document.createElement('div');
        loading.innerText = '下拉刷新数据'
        loading.className = 'refresh'
        obj.insertBefore(loading,obj.children[0])

        obj.style.marginBottom = '-60px'

        var start,
            end,
            length,
            isLock = false,//是否锁定整个操作
            isCanDo = false,//是否移动滑块
            isTouchPad = (/hp-tablet/gi).test(navigator.appVersion),
            hasTouch = 'ontouchstart' in window && !isTouchPad;


        var offset=loading.clientHeight;
        var objparent = obj.parentElement;




        /*操作方法*/
        var fn =
        {
            //移动容器
            translate: function (diff) {
                obj.style.webkitTransform='translate3d(0,'+diff+'px,0)';
                obj.style.transform='translate3d(0,'+diff+'px,0)';
            },
            //设置效果时间
            setTransition: function (time) {
                obj.style.webkitTransition='transform '+time+'s ease';
                obj.style.transition='transform '+time+'s ease';
            },
            //返回到初始位置
            back: function () {
                fn.setTransition(.2)
                fn.translate(0 - offset);
                //标识操作完成
                isLock = false;
            },
            addEvent:function(element,event_name,event_fn){
                if (element.addEventListener) {
                    element.addEventListener(event_name, event_fn, false);
                } else if (element.attachEvent) {
                    element.attachEvent('on' + event_name, event_fn);
                } else {
                    element['on' + event_name] = event_fn;
                }
            }
        };

        fn.translate(0-offset);
        fn.addEvent(obj,'touchstart',touchStart);
        fn.addEvent(obj,'touchmove',touchMove);
        fn.addEvent(obj,'touchend',touchEnd);
        fn.addEvent(obj,'mousedown',touchStart)
        fn.addEvent(obj,'mousemove',touchMove)
        fn.addEvent(obj,'mouseup',touchEnd)

        //滑动开始
        function touchStart(e) {
            if (objparent.scrollTop <= 0 && !isLock) {
                var even = typeof event == "undefined" ? e : event;
                //标识操作进行中
                isLock = true;
                isCanDo = true;
                //保存当前鼠标Y坐标
                start = hasTouch ? even.touches[0].pageY : even.pageY;
                //消除滑块动画时间
                fn.setTransition(0);
                loading.innerHTML='下拉刷新数据';
            }
            return false;
        }

        //滑动中
        function touchMove(e) {
            if (objparent.scrollTop <= 0 && isCanDo) {
                var even = typeof event == "undefined" ? e : event;
                //保存当前鼠标Y坐标
                end = hasTouch ? even.touches[0].pageY : even.pageY;

                if (start <= end) {
                    even.preventDefault();
                    //消除滑块动画时间
                    fn.setTransition(0);
                    //移动滑块
                    if((end-start-offset)/2<=150) {
//                            console.log(((end - start - offset) / 4)-30)
                        length=((end - start - offset) / 3)-40;
                        fn.translate(length);
                    }
                    else {
                        length+=0.3;
                        fn.translate(length);
                    }
                    if (end - start >= 230) {
                        loading.innerHTML='释放刷新';
                    }
                }
            }
        }
        //滑动结束
        function touchEnd(e) {
            if (isCanDo) {
                isCanDo = false;
                //判断滑动距离是否大于等于指定值
                if (end - start >= 230) {
                    //设置滑块回弹时间
                    fn.setTransition(.2);
                    //保留提示部分
                    fn.translate(0);
                    //执行回调函数
                    loading.innerHTML='正在刷新数据';

                    //松手之后执行逻辑,ajax请求数据，数据返回后隐藏加载中提示


                    // ......
                    setTimeout(function(){
                        fn.back();
                    }, 1000)


                } else {
                    //返回初始状态
                    fn.back();
                }
            }
        }
    }

    pullRefresh.prototype.changeUrl = function(url){
        this.url = url
    }

    return pullRefresh;
})