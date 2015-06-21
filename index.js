var express = require('express'), //引入express模組


    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    port = 3000;


app.use('/', express.static(__dirname + '/views')); //指定靜態HTML文件的位置



server.listen(port);

console.log("Listening on "+port+" ...");

var User = {
    info : {},

    hasExisted : function(string){
        var info = this.info;
        for(var key in info){
            if(key==string || info[key].nickname==string){
                return key;
            }
        }
        return false;
    },

    getInfo : function(userid){
        return this.info[userid];
    },

    getLength : function(){
        var num = 0;
        for(var key in this.info){
            num++;
        }
        return num;
    }
}
/*
在connection事件的回呼函数中，socket表示的是當前連接到伺服器的那個客户端。
所以代碼socket.emit('foo')則只有自己收得到這個事件，
而socket.broadcast.emit('foo')則表示向除自己外的所有人發送該事件，
另外，上面代碼中，io表示伺服器整个socket連接，所以代碼io.sockets.emit('foo')表示所有人都可以收到該事件。
*/
io.on('connection', function (socket) {
    socket.on("message", function(obj, userid){
        var date = new Date(),
            hour = date.getHours(),
            minute = date.getMinutes(),
            second = date.getSeconds();
        hour = hour<10?'0'+hour : hour;
        minute = minute<10 ? '0'+minute : minute;
        second = second<10 ? '0'+second : second;

        if(User.hasExisted(userid)){
            var info = User.getInfo(userid);
            info.msg = '<div style="font-size:'+obj.size+'; color:'+obj.color+'">'+obj.msg+'</div>';
            info.time = hour+':'+minute;
            io.sockets.emit('msg', { status:"success", info:info});
        }else{
            io.sockets.emit('msg', { status:"failure" });
        }
        
    });

    socket.on("shake", function(uid){
        if(User.getInfo(uid)){
            io.sockets.emit('system', { type:"shake", user : {nickname : User.info[uid].nickname} });
        }else{
            io.sockets.emit('msg', { status:"failure" });
        }
        
    })

    socket.on("login", function(obj){
        if(User.hasExisted(obj.nickname)){
            socket.emit("nickExisted");
        }else{
            obj.uid = socket.id;
            User.info[socket.id] = obj;
            socket.emit("loginSuccess", obj.uid);

            var s = {nickname:obj.nickname, user:User.info, len:User.getLength(), type:"login"};
            io.sockets.emit("system", s);
            
            console.log(obj.nickname+' LOGIN');
        }
    });

    socket.on("disconnect", function(){
        var uid = socket.id;
        if(User.getInfo(uid)){
            var nickname = User.info[uid].nickname;
            delete User.info[uid];
            socket.broadcast.emit('system', {user:{userid:uid, nickname:nickname}, type:"logout"})

            console.log(nickname+' LOGOUT');
        }else{

        }
    })
});