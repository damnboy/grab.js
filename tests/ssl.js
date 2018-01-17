// Note that connection/disconnection/destruction of socket is the user's responsibility,
//https://www.owasp.org/index.php/Testing_for_SSL-TLS_(OWASP-CM-001)
//批量扫描ssl服务
const net = require('net');

function registerForDestory(){
    var functions = [];

    process.on('SIGINT',function callFun(){
        functions.forEach(function(f){
            try{
                f()
            }
            catch(e){

            }
        })
        process.exit(0)
    })

    return function addFun(fun){
        functions.push(fun);
        console.log(functions.length + ' auto release functions in queue')
    }
}
var release = registerForDestory();

function createSocket(){
    var socket = net.createConnection(
        {
            "host" : "127.0.0.1",
            "port" : 22
        }, function(){
        console.log('connected')
        release(function(){
            console.log('SIGTERM')
            socket.destroy();
        })
    });
    socket.setTimeout(5000);
    socket.on('error', function(err){
        console.log(err)
    })
    return socket;
}


var tls = require('tls');
var tlsSocket = tls.connect({
    "socket" : createSocket(),
    "handshakeTimeout" : 3000,
    //"rejectUnauthorized" : false
    "checkServerIdentity" : function(servername, cert){
        console.log(servername, cert);
    }
}, function(){
     console.log('client connected',
              tlsSocket.authorized ? 'authorized' : 'unauthorized');
})

//socket hang up
/*


我翻了下Node的源码，可以看到这个错误是由如下的函数抛出的：

function socketOnEnd() {
	var socket = this;
	var req = this._httpMessage;
	var parser = this.parser;
	if (!req.res && !req.socket._hadError) {
		// 如果连接突然断开，但是客户端缺没有收到一个response，需要发布socket hang up的错误
		//createHangUpError()函数即为抛出socket hang up的异常
		req.emit('error', createHangUpError());
		req.socket._hadError = true;
	}
	if (parser) {
		parser.finish();
		freeParser(parser, req, socket);
	}
	socket.destroy();
}

注释里面也说得很清楚了，你写的那个httpServer，很明显，http的处理句柄对于GET请求根本没有返回响应的地方，但是句柄处理结束server就把socket断开了，所以客户端发现tcp连接被断开，但是确没有任何收到来自服务器的任何响应，因为会抛出这个错误，而且你的客户端代码中也没有使用

req.on('error', err=>console.error(err));

进行异常捕获，所以这个错误直接被抛出成Unhandled错误（未处理的异常），导致客户端进程crash；
其实有很多解决办法，一个是我上面写的给GET请求添加进行处理的函数；
另外就是增加error处理的函数，这样抛出异常，客户端也不会挂掉~

*/