const express = require("express");
const pool = require("./database");
const app = express();
const http = require('http').Server(app);
var cors = require("cors");
const { Server } = require("socket.io");
var request = require('requests');
// const io = new Server(server, {
//   cors: {
//     origin: "*",
//   },
// });
const io = require('socket.io')(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    transports: ['websocket', 'polling'],
    credentials: true
  },
  allowEIO3: true
});
const port = 8000;

app.use("*", cors());

io.on("connection", (socket) => {
  console.log("a user connected");
 
  pool.query(`select Socket_id from users where id=?`,socket.handshake.query["type"]=="Tutor"?socket.handshake.query["tutor_id"]:socket.handshake.query["Student_id"],
  (error,result)=>{
    if(error){
      console.log(error)
    }
    else{
      console.log("connected,1")
      pool.query(`update users set Socket_id=? where id =?`,[socket.id,socket.handshake.query["type"]=="Tutor"?socket.handshake.query["tutor_id"]:socket.handshake.query["Student_id"]])
    }
  })
  
  
  
  
  console.log(socket.handshake.query["type"],'ahahahah')
  socket.on("get_chat_list",()=>{
    if(socket.handshake.query["type"]=="Tutor"){
      pool.query(`select * from chats where tutor_id=?`,socket.handshake.query["tutor_id"],
      (err,res)=>{
        if(err){
          console.log(err)
        }else{
          if(res.length==0){
            socket.emit("chat_list",{message:"No conversations"})
          }
          else{
            // console.log(res)
            let temp = [];
            res.forEach((element,i)=>{
              pool.query(`select * from users where id=?`,element.student_id,(er,re)=>{
                if(er){
                  console.log(er)
                 }
                else{
                  pool.query(`select COUNT(*) from messages where seen=0 and (chat_id=? and sender_id=?)`,
                  [element.chat_id,element.student_id],(errorr,results)=>{
                    // console.log(results,"sccccxxxsseee")
                    if(errorr){
                      console.log(errorr)
                    }
                    else{
                       // console.log(element.chat_id,'aassss')
                      pool.query(`select * from messages where chat_id=? ORDER BY id desc limit 1`,element.chat_id,(e,r)=>{
                        if(r){
                          console.log(r)
                        }
                        // console.log(re[0],r[0],'aaallll')
                        if(r[0]== undefined){
                          temp.push({userid:re[0].id,Name:re[0].name,Image:re[0].profile_pic,Email:re[0].email,last_message:"no Message",last_m:"",Un_seen_status:r[0].seen,Unseen_Count:results[0]["COUNT(*)"]})
                        }
                        else{
                          temp.push({userid:re[0].id,Name:re[0].name,Image:re[0].profile_pic,Email:re[0].email,last_message:r[0].message,last_m:r[0].time,Un_seen_status:r[0].seen,Unseen_Count:results[0]["COUNT(*)"]})
                        }
                        temp.sort(function(a, b) { 
                          return new Date(a.last_m) - new Date(b.last_m);
                        })
                        console.log(temp,"aaa")
                        socket.emit("chat_list",temp.reverse())
                      })
                     
                    }
                  })
                }
              })
            })
  
          }
        }
      })
    }
    ////
    else{      
      pool.query(`select * from chats where student_id=?`,socket.handshake.query["Student_id"],
      (err,res)=>{
        if(err){
          console.log(err)
        }else{
          if(res.length==0){
            socket.emit("chat_list",{message:"No conversations"})
          }
          else{
            // console.log(res)
            let temp = [];
            res.forEach((element,i)=>{
              pool.query(`select * from users where id=?`,element.tutor_id,(er,re)=>{
                if(er){
                  console.log(er)
                 }
                else{
                  pool.query(`select COUNT(*) from messages where seen=0 and (chat_id=? and sender_id=?)`,
                  [element.chat_id,element.tutor_id],(errorr,results)=>{
                    if(errorr){
                      console.log(errorr)
                    }else{
                      // console.log(element.chat_id,'aassss')
                      pool.query(`select * from messages where chat_id=? ORDER BY id desc limit 1`,element.chat_id,(e,r)=>{
                        if(r){
                          console.log(r)
                        }
                        // console.log(re[0],r[0],'aaallll')
                        
                        if(r[0]== undefined){
                          temp.push({userid:re[0].id,Name:re[0].name,Image:re[0].profile_pic,Email:re[0].email,last_message:"no Message",last_m:"",Un_seen_status:r[0].seen,Unseen_Count:results[0]["COUNT(*)"]})
                        }
                        else{
                          temp.push({userid:re[0].id,Name:re[0].name,Image:re[0].profile_pic,Email:re[0].email,last_message:r[0].message,last_m:r[0].time,Un_seen_status:r[0].seen,Unseen_Count:results[0]["COUNT(*)"]})
                        }
                        temp.sort(function(a, b) { 
                          return new Date(a.last_m) - new Date(b.last_m);
                        })
                        socket.emit("chat_list",temp.reverse())
                      })
                    }
                  })
                }
              })
            })
  
          }
        }
      })
    }

  })
  ///
  socket.on("disconnect", (reason) => {
  console.log(reason); // "ping timeout"
});
  // console.log(socket.handshake.query["Student_id"],socket.handshake.query["tutor_id"]);
  pool.query(`select chat_id from chats where student_id=? and tutor_id=?`,[socket.handshake.query["Student_id"],socket.handshake.query["tutor_id"]],
    (err,res)=>{
      if(res){
        if(res.length>0){
          // console.log(res[0].chat_id)
          socket.join(res[0].chat_id)
          console.log("room Connected")
          // socket.to(res[0].chat_id).emit("test_emit","Connected")
        }
        else{
          console.log("Cannot Join to ROOM")
        }
      }
      else{
        console.log(err)
      }
    })

  
   socket.on("Get_old_messages",(roomid)=>{
	console.log(roomid);
    pool.query(`select * from messages where chat_id=?`,roomid,
    (err,res)=>{
      if(res){
	// console.log(res);
        socket.emit("Recieve_old_messages",res)
      }
      else{
        console.log(err)
      }
    })
  })



 socket.on("Send_message",(chatid,userid,_message,_time)=>{
  // io.to(chatid).emit("qwe", {"chat_id": 1, "created_at": null, "id": 32, "message": "asasasasa", "seen": 0, "sender_id": 87, "time": "2021-09-20 14:17:26", "updated_at": "2021-09-20T14:17:26.000Z"})
   pool.query(`insert into messages(chat_id,sender_id,message,time) values(?,?,?,?)`,[chatid,userid,_message,_time],
   (err,res)=>{
     if(res){
       pool.query(`select * from messages where id=?`,res.insertId,
       (error,results)=>{
         if(results){
           // console.log(results[0])
           io.to(chatid).emit("messsageget",results[0])
                 pool.query(`select * from chats where chat_id=?`,chatid,(er,re)=>{
                   if(er){
                     console.log(er)
                   }
                   else{
                     pool.query(`select name,id,Socket_id from users where id=?`,userid==re[0].student_id?re[0].tutor_id:re[0].student_id,
                     (e,r)=>{
                       if(e){
                         console.log(e)
                       }
                       else{
                        console.log(r[0].Socket_id,"ccccccccccc")
                         socket.to(r[0].Socket_id).emit("reload")
                         socket.to(r[0].Socket_id).emit("Notification",{user_id:r[0].id,message_from:r[0].name,message:_message,time:_time})
                          if(socket.handshake.query["type"]=="Tutor"){
                            Send_notification(r[0].id,r[0].name,_message,_time)
                          }
                        }
                     })
                   }
                 })
         }
         else{
           console.log(error,"222")
         }
       })
      //  console.log(res,"Sendmessage")
     }
      else{
        console.log(err,'1')
      }
   }
   )
 })
 
});

function Send_notification(id,name,_message,time){
  var options = {
    'method': 'POST',
    'url': 'https://zeelco.com/api/push_notification',
    'headers': {
      'Content-Type': 'application/json'
    },
    formData: {
      'user_id': id,
      'user_name': name,
      'msg_time': _message,
      'message': time
    }
  };
  request(options, function (error, response) {
    if (error) throw new Error(error);
    console.log(response.body);
  });
  
}


http.listen(port, () => {
  console.log(`App started on ${port}!`);
});
