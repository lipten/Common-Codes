var V=self={};
var utils={};


utils.maxInt = 6;   //-- �����������
utils.maxFloat = 2; //-- ���С������

//-- ���ּ�������ת�˽��
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

//-- ȷ��ת��
self.transfer = function(){
	var result = document.getElementById('input-money').innerText;
	if(result==""){
		console.log('ת�˽���Ϊ��')
	}
	else if(!result.match(/[[1-9]+|\.]$/)){
		console.log('ת�˽���Ϊ��')
	}else {
		result=result.replace(/(\.$)|(\.0)$/,'');
		console.log('ȷ��ת�˽�'+result)
	}


	//-- ����ת�˽��...
}