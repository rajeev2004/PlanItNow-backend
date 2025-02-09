import express from "express";
import dotenv from 'dotenv';
import cors from 'cors';
import usersRouter from './routes/userRoutes.js'; 
dotenv.config();
const app=express();
app.use(express.json());
app.use(cors());
app.use('/api/users',usersRouter);
const PORT=process.env.PORT||5000;
app.listen(PORT,()=>{
  console.log(`Server is running on port ${PORT}`);
});
