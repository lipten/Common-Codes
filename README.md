

# Common-Codes
>这里积累了我平时需要用到的代码段和小实例，放在github方便copy，顺便分享~

----------


## 代码段：
>积累的通用代码段，可直接copy调用

#### ajax.js
封装了一套较完善的ajax请求方法，类似jquery的$.ajax()方法。

#### appInterface.js
用户Hybrid应用的jsBridge接口。
前端发起原生接口：
```
AppInterface.call('/alert',{title:'弹出框标题',msg:'弹出框描述'},function(data){
            !!data&&alert(data);
        });
```

## 实例：
>通过简单的实例实现某些场景的逻辑代码

#### Number-Input
输入转账金额时候的数字键盘，实现金额格式的严格验证，方便扩展和修改。
