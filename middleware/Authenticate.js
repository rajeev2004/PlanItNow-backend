import jwt from 'jsonwebtoken';
function Authenticate(req,res,next){
    try{
        const token=req.header('Authorization')?.split(' ')[1];
        if(!token){
            return res.status(401).json({message:'Access Denied'});
        }
        const decoded=jwt.verify(token,process.env.SECRET_kEY);
        req.user=decoded;
        next();
    }catch(error){
        console.error(error.message);
        return res.status(400).json({message:'Invalid Token'});
    }
}
export default Authenticate;