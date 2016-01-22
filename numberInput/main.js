var V=self={};
var utils={};


utils.maxInt = 6;   //-- 最大整数长度
utils.maxFloat = 2; //-- 最大小数长度

//-- 数字键盘输入转账金额
self.type = function(val){
	var pretext=document.getElementById('pretext')
	var inputMoney = document.getElementById('input-money');
	var text = inputMoney.innerText;

	switch (val){
		case 1:
		case 2:
		case 3:
		case 4:
		case 5:
		case 6:
		case 7:
		case 8:
		case 9:
			if(text.match(/(^0\.\d?)|([1-9]+)/)||text==''){
				text += val;
				pretext.classList.add('hide')
			}
			break;
		case 'back':
			if(text.match(/^0\.$/)){
				text = ''
				pretext.classList.remove('hide')
			}else if(text.length>1){
				text=text.substring(0,text.length-1);
			}else if(text.length==1){
				text=text.substring(0,text.length-1);
				pretext.classList.remove('hide')
			}
			break;
		case 0:
			if(!text.match(/(\d+\.\d)|^0\d/)){
				text += '0';
				pretext.classList.add('hide');
			}
			break;
		case '.':
			if(text==''){
				text = 0+'.';
				pretext.classList.add('hide');
			}else if(!text.match(/\./)){
				text += '.';
				pretext.classList.add('hide');
			}
	}

	var int = parseInt(text*1)+'';
	var float = ''
	if(text.match(/\./)){
		float = text.substring(text.indexOf('.')+1,text.length);
	}
	if(int.length<=utils.maxInt&&float.length<=utils.maxFloat) {
		inputMoney.innerText = text
	}

}

//-- 确认转账
self.transfer = function(){
	var result = document.getElementById('input-money').innerText;
	if(result==""){
		console.log('转账金额不能为空')
	}
	else if(!result.match(/[[1-9]+|\.]$/)){
		console.log('转账金额不能为零')
	}else {
		result=result.replace(/(\.$)|(\.0)$/,'');
		console.log('确认转账金额：'+result)
	}


	//-- 处理转账金额...
}