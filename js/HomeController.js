'use strict';
 //Define `SetupController`

app.controller('HomeController', function($scope, $stateParams, $location) {
$scope.isControllModel=1;  //初始允许控制
 
    //初始化文本显示
    if (!$scope.showModel) {
        $scope.showModel = "textShow";
    }
    //传参判断,绑定操作
    if ($stateParams.pid && $scope.Messages.getIsBound().tag == false) {
       $.showLoading('绑定设备中..');
        setTimeout(function() {
            sendBind($stateParams.pid);
        }, 2000)
    }
    $scope.$watch('Messages.getIsBound().tag', function(newValue,oldValue){ 
        if ( oldValue == false && newValue == true) {
            $location.path('msg');
        }
    });
	
 	//刷新操作
 	$scope.refresh = function(){
		
        //检查是否绑定设备
        if (!$scope.Messages.getIsBound().tag) {	
            $.toptip("设备未绑定");
            return;
        }
 		//sendQueryPosture(); //发送刷新请求
		alert("该功能未开放");
 	}
 	//复位操作
 	$scope.reset = function(){
        //检查是否绑定设备
        if (!$scope.Messages.getIsBound().tag) {
            $.toptip("设备未绑定");
            return;
        }
        //检查是否打开控制模式
        if (!$scope.isControllModel) {
            $.toptip('请在「设置」中打开控制模式', 'warning');
            return;
        }
        $.confirm({
            title: '确认发送？',
            text: '您确认要「复位」设备吗？',
            onOK: function () {
             //  sendControllPosture('reset', '');
            }
        });
        //ws.close();
 	}

 	//popup控件初始化
 	var DevBoolPos;
 	var DevNumPos;	
  $scope.DevBoolBT = function(pos){
        //检查是否打开控制模式
        if (!$scope.isControllModel) {
            $.toptip('请在「设置」中打开控制模式', 'warning');
            return;
        }
        DevBoolPos = pos;
	  $scope.DevBoolPos = pos;
	      $scope.DevBoolName =  $scope.Messages.getDevBoolStatInfo()[DevBoolPos].name;
		//alert("您点击了开关量："+　DevBoolPos);//此处obj就对应html页面中的<a>);
        $("#controll-devboolstat").popup();
    }
		
    $scope.DevNumBT = function(pos){
        //检查是否打开控制模式
        if (!$scope.isControllModel) {
            $.toptip('请在「设置」中打开控制模式', 'warning');
            return;
        }
		DevNumPos = pos;
       $scope.DevNumPos = pos;
	  
	    $scope.DevNumName =  $scope.Messages.getDevNumStatInfo()[DevNumPos].name;
		 $scope.DevNumVal =  $scope.Messages.getDevNumStatInfo()[DevNumPos].value;
		alert("您点击了数字量："+$scope.DevNumName+"\r\n 当前值是："+$scope.DevNumVal+"");//此处obj就对应html页面中的<a>);
		
        switch(pos){
            case 'head': 
                $scope.pos = '抬背';
                $scope.angle = $scope.Messages.getPosture().head;
                $scope.unit = 'º';
                $scope.maxAngle = 60;
            break;
            case 'leg': 
                $scope.pos = '抬腿';
            $scope.angle = $scope.Messages.getPosture().leg;
            $scope.unit = 'º';
            $scope.maxAngle = 30;
            break;
            case 'left': 
                $scope.pos = '左翻';
                $scope.angle = $scope.Messages.getPosture().left;
                $scope.unit = 'º';
                $scope.maxAngle = 20;
            break;
            case 'right': 
                $scope.pos = '右翻';
                $scope.angle = $scope.Messages.getPosture().right;
                $scope.unit = 'º';
                $scope.maxAngle = 20;
            break;
            case 'lift': 
                $scope.pos = '升降';
                $scope.angle = $scope.Messages.getPosture().lift;
                $scope.unit = 'cm';
                $scope.maxAngle = 20;
            break;
            case 'before': 
                $scope.pos = '前倾';
                $scope.angle = $scope.Messages.getPosture().before;
                $scope.unit = 'º';
                $scope.maxAngle = 10;
            break;
            case 'after': 
                $scope.pos = '后倾';
                $scope.angle = $scope.Messages.getPosture().after;
                $scope.unit = 'º';
                $scope.maxAngle = 10;
            break;
            default:
                $scope.pos = '--';
                $scope.angle = 0;
                $scope.maxAngle = 0;
            }
            if ($scope.maxAngle != 0) {
                $scope.percent = $scope.angle / $scope.maxAngle * 100;
            }        
      //  $("#controll-devnumstat").popup();  //弹出控制界面
    }

	
  	//滑块控件
  	$('#angle-slider').slider(function (percent) {
  		$scope.percent = percent;
        $scope.angle = parseInt(percent / 100 * $scope.maxAngle);
        $scope.$apply();
    });

  	//增加角度操作
  	$scope.up = function(){
  		if ($scope.angle == '--' || $scope.angle == null) {$scope.angle = 0;}
  		if($scope.angle >= $scope.maxAngle){
  			$scope.angle = $scope.maxAngle;
  			$scope.percent = 100;

  		}else{
  			$scope.angle ++;
  			$scope.percent = $scope.angle / $scope.maxAngle * 100;
  		}
  		//$('#angle-slider').slider();
  	}

  	//减少角度操作
  	$scope.down = function(){
  		if($scope.angle <= 0 || $scope.angle == '--'){
  			$scope.angle = 0;
  			$scope.percent = 0;
  		}else{
  			$scope.angle --;
  			$scope.percent = $scope.angle / $scope.maxAngle * 100;
  		}
  	}
	
	//开关量控制
	$scope.sendboolcmd= function(stat){
		
	//alert("开关点击时间"+DevBoolPos+":"+stat);
	//alert("开关名称:"+$scope.Messages.getDevBoolStatInfo()[2].name);
	var boolname=$scope.Messages.getDevBoolStatInfo()[DevBoolPos].name;
	var msg="{'type':'boolkz','cmd','"+boolname+"+"+stat+"'}";	
	sendControllPosture(msg);
	
	}
	//数字量控制
	$scope.sendnumcmd= function(val){
		alert("数字量点击事件"+DevnumPos+":"+val);
	sendControllPosture(DevnumPos,val);
	
	}
  	//发送姿态操作
  	$scope.send = function(){
  		//检查控制权限
  		//检查姿态
  		if ($scope.pos == '--' || $scope.angle == '--' || $scope.pos == null || $scope.angle == null) {
  			$.toptip('请输入正确姿态');
  			return;
  		}
        //检查是否绑定设备
        if (!$scope.Messages.getIsBound().tag) {
            $.toptip("设备未绑定");
            return;
        }
  		$.confirm({
  			title: '确认发送？',
  			text: '您确认要将「' + $scope.pos + '」姿态调整到' + $scope.angle + $scope.unit + '吗？',
  			onOK: function () {

               sendControllPosture(posTag, $scope.angle);
               $.closePopup();
            },
            onCancel: function () {
              $.closePopup();
            }
        });
  	}

});