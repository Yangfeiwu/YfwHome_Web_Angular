'use strict';
//定义 "SmartBedApp" 模式
var app = angular.module('SmartBedApp', ['ui.router', 'ngWebSocket']);

//定义路由 
app.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/home');
 
    $stateProvider
        .state('home', {
            url:'/home',
            views: {
                'content': {
                    templateUrl: 'fragment/home.html',
                    controller: 'HomeController' 
                },
                'footer': {
                    templateUrl: 'fragment/footer.html',
                }
            }
        })
        .state('bind', {
            url:'/bind/:pid',
            views: {
                'content': {
                    templateUrl: 'fragment/home.html',
                    controller: 'HomeController' 
                },
                'footer': {
                    templateUrl: 'fragment/footer.html',
                }
            }
        })

        .state('setup', {
            url:'/setup',
            views: {
                'content': {
                    templateUrl: 'fragment/setup.html',
                    controller: 'SetupController' 
                },
                'footer': {
                    templateUrl: 'fragment/footer.html',
                }
            }
        })
        .state('record', {
            url:'/record/:key/:value',
            views: {
                'content': {
                    templateUrl: 'fragment/record.html',
                    controller: 'RecordController'
                },
                'footer': {
                    templateUrl: 'fragment/footer.html',
                }
            }
        })
        .state('msg', {
            url:'/msg',
            views: {
                'content': {
                    templateUrl: 'fragment/msg.html',
                    controller: 'MsgController'
                },
                'footer': {
                    templateUrl: 'fragment/footer.html',
                }
            }
        })
        .state('video', {
            url:'/video',
            views: {
                'content': {
                    templateUrl: 'fragment/video.html',
                    controller: 'VideoController'
                },
                'footer': {
                    templateUrl: 'fragment/footer.html',
                }
            }
        })

}]);

//注入服务
app.factory('Messages', Messages);

//主控制器
app.controller('mainController', function($scope, $rootScope, Messages) {
    //连接websocket
    $rootScope.Messages = Messages;
	
    $(function() {
        FastClick.attach(document.body);
    });
    
});
/*
if (typeof console == "undefined") {    this.console = { log: function (msg) {  } };}
    // 如果浏览器不支持websocket，会使用这个flash自动模拟websocket协议，此过程对开发者透明
    WEB_SOCKET_SWF_LOCATION = "/swf/WebSocketMain.swf";
    // 开启flash的websocket debug
    WEB_SOCKET_DEBUG = true;
*/

//websocket
var ws;
var receiver_socket;
var isBound = {'tag':false, 'PID':null, 'text':'未绑定', 'title':'请先在「设置」中绑定设备'};
//待定PID，已绑定PID
var inputPID = null;
//姿态
//var posture = {'head':'--','leg':'--','left':'--','right':'--','lift':'--','before':'--','after':'--','time':null};
var posture = {'head':'1','leg':'1','left':'0','right':'1','lift':'0','before':'23','after':'88','time':null};
//设备开关量状态信息（json格式接收 ）
var DevBoolStatInfo=[{
                    name: 'LED1',
                    value: 'OFF'
                }, {
                    name: 'LED2',
                    value: 'ON'
                },{
                    name:"LED3",
                    value:"OFF"
                }];
var DevNumStatInfo=[{
                    name: 'Temp1',
                    value: '188'
                }, {
                    name: 'Temp2',
                    value: '288'
                },{
                    name:"Temp3",
                    value:"388"
                }];		
				
var imgdata;						
				
//记录
var record_dates, record_postures;
//设备发来的文本消息
var RxDevMsg="未收到文本消息！";
//ws服务
function Messages($websocket) {
   //alert("初始化websocke");
    
    init($websocket);
    // setTimeout(function() {
    //   ws.close();
    // }, 500)

    //异步返回，更新绑定的UI对象
    return {
        getIsBound: function() {
            return isBound;
        },
        getPosture: function() {
            return posture;
        },
        getRecordDates: function(){
            return record_dates;
        },
        getRecordPostures: function(){
            return record_postures;
        },
	    getDevMsg: function(){
            return RxDevMsg;
        },
	    getDevBoolStatInfo: function(){
            return DevBoolStatInfo;
        },
		getDevNumStatInfo: function(){
            return DevNumStatInfo;
        },
		getimg: function(){
            return imgdata;
        }		
					
    };
}

//ws初始化
function init($websocket){
	
//	receiver_socket=$websocket("ws://"+document.domain+":8008");
//	var image = $("#receiver");
//	receiver_socket.onMessage(onmessage2);
	
// function onmessage2(e)
//         {
// 		// console.log(e.data);	
		 
//          imgdata=e.data;
//         }
	//     receiver_socket.onClose(function(event) {
	// 		 console.log("receiver_socket连接关闭的..");
	// 	})
    // //建立连接时
    // receiver_socket.onOpen(function() {
    //   console.log("receiver_socket连接中..");

    // });		
	

    ws = $websocket("ws://"+document.domain+":8282");
    ws.onMessage(onmessage);

    ws.onError(function(event) {
      console.log('connection Error', event);
	  
    });

    //断开连接时
    ws.onClose(function(event) {
        console.log("连接关闭，定时重连");
        var oldpid = isBound['PID'];
        var oldtag = isBound['tag'];
        //各种状态复位
        isBound = {'tag':false, 'PID':null, 'text':'未绑定', 'title':'连接已重新修复'};
        posture = {'head':'--','leg':'--','left':'--','right':'--','lift':'--','before':'--','after':'--','time':null};
        record_dates = null;
        record_postures = null;
        //重连
        init($websocket);
        //发送消息后打开加载框
        if (oldtag && oldpid) {
            $.showLoading('连接已断开，正在重新绑定..');
            setTimeout(function() {
                sendBind(oldpid);
            }, 2000)

        }
        
    });

    //建立连接时
    ws.onOpen(function() {
      console.log("连接中.. ["+ Math.random() + "]");

    });
    // setTimeout(function() {
    //   ws.close();
    // }, 500)
}

// 服务端发来消息时（核心部分：①解析设备反馈，②发送相应指令）
function onmessage(e)
{	
    //接收到消息则取消加载框
    $.hideLoading();
    console.log('接受到的数据：' + e.data);
    var data = JSON.parse(e.data);

	
    switch(data['type']){
        // 服务端ping客户端
        case 'ping':
            ws.send('{"type":"pong"}');
        break;
        case 'SERVER_FEEDBACK':
            console.log("收到反馈信息.\n");
            parseServerFeedback(data);
        break;
        case 'POSTURE':
            console.log("设备姿态查询成功.\n");
            parsePosture(data);
        break;
        case 'DONE':
            console.log("命令执行成功.\n");
         //   parseDone(data);
        break;
        case 'UNDONE':
            parseUndone(data);
        break;
        case 'RECORD':
            queryRecord(data);
        break;
		case 'DevMsg':		
			console.log('接受到的数据：' +data['data']);  //调试打印data字符串
			
			var Infodata=JSON.parse(data['data']); 
			   switch(Infodata.infotype){
					case 'bool':
						DevBoolStatInfo=Infodata.info;
					break;
					case 'num':
						DevNumStatInfo=Infodata.info;
					break;					
			   }
		break;
		
		
    }
}

    //解析服务器反馈消息
    function parseServerFeedback(data){
      for(var code in data['content']){
            //遍历json对象的每个key/value对
            var text = data['content'][code];
            var feedback = '服务器反馈信息：'+ text + '[' + code + ']';
            console.log(feedback);
            //获取绑定/解绑反馈信息
            switch(code){
                case '010':
                    isBound['tag'] = true;
                    isBound['text'] = '已绑定';
                    isBound['PID'] = inputPID;
                    isBound['title'] = '设备已绑定。正在实时监控中..';
                break;
                case '020':
					//各种状态复位
                    isBound['tag'] = false;
                    isBound['text'] = '未绑定';
                    isBound['PID'] = null;
                    isBound['title'] = '请先在「设置」中绑定设备';
                    posture = {'head':'--','leg':'--','left':'--','right':'--','lift':'--','before':'--','after':'--','time':null};
					record_dates = null;
					record_postures = null;
				break;
            }
            if (code.charAt(2) === '0') {
                //成功反馈UI
                $.toptip(text, 'success');
              } else {
                //失败反馈UI
                $.toptip(text);
              }
            //只需要第一个key/value对  
            break;
          } 
        }


    //解析工作完成消息
    function parseDone(data){
        if (data['content'] !== null) {
            posture = data['content'];
            if (posture['time'] !== null) {
                isBound['title'] = '姿态调整于' + posture['time'];
            }
        } 
        $.notification({
            title: "新消息",
            text: "设备已调整到新姿态！",
            media: "<img src='../images/success.png'>",
            data: "设备已调整到新姿态！",
            onClick: function(data) {
                $.alert(data);
            }
        });
    }

     //解析工作异常消息
    function parseUndone(data){
        for(var code in data['content']){
            //遍历json对象的每个key/value对
            var text = data['content'][code];
            console.log(text);
            //获取绑定/解绑反馈信息
            //只需要第一个key/value对  
            //$.toptip(text, 'warning');
            $.toptip(text);
            break;
        }  
    }

    //解析姿态消息
    function parsePosture(data){
        if (data['content'] !== null) {
            posture = data['content'];
            if (posture['time'] !== null) {
                isBound['title'] = '姿态调整于' + posture['time'];
            }
        } 
        $.toptip('姿态查询成功', 'success');
      
    }

    //给设备发送消息
    function sendControllPosture(msg){
        console.log("发送控制消息");
      //  var content = '{"msg ": 7 ,"msgdata":"88"}';

		var content="{  \"msg\": 7,\"msgdata\": \""+msg+"\" }";	
        send('CONTROL_DevStat', content);
    }

    //发送查询姿态消息
    function sendQueryPosture(){
        console.log("发送查询姿态消息");
        send('QUERY_POSTURE', '{}');
    }

    //发送查询记录消息
    function sendRecord(key, value) {
        console.log("发送查询记录消息");
        var content = '{"'+ key +'":"'+ value +'"}';
        send('QUERY_RECORD', content);
    }

    //解析记录(记录日期、记录姿态)
    function queryRecord(data){
        //$.toptip('姿态查询成功', 'success');
        /*for (var key in data['content']) {
            switch (key) {
                case 'dates':
                    console.log("查询记录日期成功.\n");
                    record_dates = data['content'][key];
                break;
                case 'postures':
                    console.log("设备记录姿态成功.\n");
                    record_postures = data['content'][key];
                break;
            }
        //content中只有一个key/value
        break;
        }*/
        switch (data['from']) {
            case 'dates':
                console.log("查询记录日期成功.\n");
                record_dates = data['content'];
            break;
            case 'postures':
                console.log("设备记录姿态成功.\n");
                record_postures = data['content'];
            break;
        }
    }

    //发送绑定消息
    function sendBind(pid){
        console.log('发送绑定消息');
        var content = '{"PID":"'+ pid +'"}';
        inputPID = pid;
        send('BIND', content);
    }

    //发送解除绑定消息
    function sendUnbind(){
        console.log('发送解除绑定消息');
        send('UNBIND', '{}');
    }

    //发送消息
    function send(type, content){
        var json_data = '{"type":"'+ type +'","from":"USER","content":'+ content +'}';
        ws.send(json_data);
        console.log("发送的数据: "+ json_data + "\n");
        //发送消息后打开加载框
        $.showLoading();
    }

    //打印时间
    function formatDateTime(theDate) {
      var _hour = theDate.getHours();
      var _minute = theDate.getMinutes();
      var _second = theDate.getSeconds();
      var _year = theDate.getFullYear();
      var _month = theDate.getMonth();
      var _date = theDate.getDate();
      if(_hour<10){_hour="0"+_hour;}
      if(_minute<10){_minute="0"+_minute;  }
      if(_second<10){_second="0"+_second;  }
      _month = _month + 1;
      if(_month < 10){_month = "0" + _month;}
      if(_date<10){_date="0"+_date;}
      return  _year + "-" + _month + "-" + _date + " " + _hour + ":" + _minute + ":" + _second;
    }