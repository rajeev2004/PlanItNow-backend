import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from '../config/db.js';
export async function register(req,res){
    try{
        const key=process.env.SECRET_KEY;
        const {name,email,pass}=req.body;
        if(name && email && pass){
            const result=await db.query("select * from users where name=$1 OR email=$2",[name,email]);
            if(result.rows.length>0){
                return res.status(400).json({message:'user already exist'});
            }
        }
        const hashedPassword=await bcrypt.hash(pass,10);
        const response=await db.query("insert into users (email,password,name) values($1,$2,$3) RETURNING *",[email,hashedPassword,name]);
        const token=jwt.sign({Id:response.rows[0].id},key,{expiresIn:'24h'});
        res.status(201).json({token,message:'user registered'});
    }catch(err){
        console.error(err.message);
        res.status(500).json({message:'server error'});
    }
}
export async function login(req,res){
    try{
        const key=process.env.SECRET_KEY;
        const{email,pass}=req.body;
        const result=await db.query("select * from users where email=$1",[email]);
        if(result.rows.length===0){
            return res.status(400).json({message:'no user found'});
        }
        const isPasswordCorrect=await bcrypt.compare(pass,result.rows[0].password);
        if(!isPasswordCorrect){
            return res.status(400).json({message:'invalid email or password'});
        }
        const token=jwt.sign({Id:result.rows[0].id},key,{expiresIn:'24h'});
        res.status(200).json({token,message:'login successful'});
    }catch(err){
        console.error(err.message);
        res.status(500).json({message:'server error'});
    }
}
export async function getEveryEvent(req,res){
    const {id}=req.params;
    console.log(id);
    try{
        const response=await db.query('select * from events where user_id!=$1 ORDER BY date_time>=CURRENT_DATE,date_time ASC',[id]);
        res.status(200).json(response.rows);
    }catch(err){
        console.error(err);
        res.status(500).json({message:'server.error'})
    }
}
export async function addEvent(req,res){
    const {id}=req.params;
    const {title,description,location,date}=req.body;
    try{
        const currentDate=new Date().toISOString().split("T")[0];
        if(currentDate>=date){
            return res.status(200).json({message:'cannot create a past event'})
        }
        const result=await db.query("insert into events (user_id,title,description,date_time,location) values($1,$2,$3,$4,$5) RETURNING *",[id,title,description,date,location]);
        if(result.rows.length>0){
            res.status(201).json({success:true});
        }
    }catch(err){
        console.error(err);
        res.status(500).json({message:'server error'});
    }
}
export async function eventDetail(req,res){
    const {id}=req.params;
    try{
        const response=await db.query('select * from events where id=$1',[id]);
        if(response.rows.length>0){
            res.status(200).json({success:true,data:response.rows});
        }
    }catch(err){
        console.error(err);
        res.status(500).json({message:'server error'});
    }
}
export async function joinEvent(req,res){
    const {eventid,id}=req.params;
    try{
        const eventCheck=await db.query('select date_time from events where id=$1',[eventid]);
        const event_date=new Date(eventCheck.rows[0].date_time);
        const current_date=new Date();
        if(current_date>event_date){
            return res.status(200).json({success:false});
        }
        const alreadyJoin=await db.query("select * from attendees where event_id=$1 AND user_id=$2",[eventid,id]);
        if(alreadyJoin.rows.length>0){
            return res.status(200).json({message:'already Joined'});
        }
        const response=await db.query("insert into attendees (event_id,user_id) values($1,$2) RETURNING *",[eventid,id]);
        if(response.rows.length>0){
            await db.query('update events set attendee_count=attendee_count+1 where id=$1',[eventid]);
            res.status(200).json({success:true});
        }else{
            res.status(200).json({success:false});
        }
    }catch(err){
        console.error(err);
        res.status(500).json({message:'server error'});
    }
}
export async function searchEvent(req,res){
    const {term,id}=req.params;
    const searchTerm=`%${term}%`;
    try{
        const response=await db.query('select * from events where LOWER(title) like $1 AND user_id!=$2',[searchTerm,id]);
        res.status(200).json(response.rows);
    }catch(err){
        console.error(err);
        res.status(500).json({message:'server error'});
    }
}
export async function myEvents(req,res){
    const {id}=req.params;
    try{
        const response=await db.query('select * from events where user_id=$1 ORDER BY date_time>=CURRENT_DATE,date_time ASC',[id]);
        res.status(200).json(response.rows);
    }catch(err){
        console.error(err);
        res.status(500).json({message:'server error'});
    }
}
export async function deleteEvent(req,res){
    const {id}=req.params;
    try{
        const response=await db.query("delete from events where id=$1 RETURNING *",[id]);
        if(response.rows.length>0){
            res.status(200).json({success:true});
        }else{
            res.status(404).json({success:false});
        }
    }catch(err){
        console.error(err);
        res.status(500).json({message:'server error'});
    }
}
export async function updateEvent(req,res){
    const {id}=req.params;
    const {title,description,location,date_time}=req.body;
    try{
        const response=await db.query("update events set title=$1,description=$2,location=$3,date_time=$4 where id=$5 RETURNING *",[title,description,location,date_time,id]);
        if(response.rows.length>0){
            return res.status(200).json({success:true});
        }
    }catch(err){
        console.error(err);
        res.status(500).json({message:'server error'});
    }
}
export async function attendeeEvent(req,res){
    const {id}=req.params;
    try{
        const response=await db.query('select e.* from events e INNER JOIN attendees a ON e.id=a.event_id where a.user_id=$1 ORDER BY e.date_time ASC',[id]);
        res.status(200).json(response.rows);
    }catch(err){
        console.error(err);
        res.status(500).json({message:'server error'});
    }
}
export async function deleteAttendingEvent(req,res){
    const {id}=req.params;
    try{
        const response=await db.query('update events set attendee_count=attendee_count-1 where id=$1 RETURNING *',[id]);
        const response2=await db.query('delete from attendees where event_id=$1 RETURNING *',[id]);
        if(response.rows.length>0 && response2.rows.length>0){
            return res.status(200).json({success:true})
        }else{
            res.status(404).json({message:false});
        }
    }catch(err){
        console.error(err);
        res.status(500).json({message:'server error'});
    }
}
export async function events(req,res){
    try{
        const response=await db.query('select * from events ORDER BY date_time>=CURRENT_DATE,date_time ASC');
        res.status(200).json(response.rows);
    }catch(err){
        console.error(err);
        res.status(500).json({message:'server error'});
    }
}
export async function guestSearchEvent(req,res){
    const {term}=req.params;
    const searchTerm=`%${term}%`;
    try{
        const response=await db.query('select * from events where LOWER(title) like $1',[searchTerm]);
        res.status(200).json(response.rows);
    }catch(err){
        console.error(err);
        res.status(500).json({message:'server error'});
    }
}