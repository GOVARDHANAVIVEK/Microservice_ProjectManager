const jwt = require('jsonwebtoken')

const verifyToken = (req,res,next)=>{
    const Bearer_token = req.headers['authorization'];
    if(!Bearer_token || !Bearer_token.startsWith('Bearer')){
        return res.status(404).send("No token found")
    }
    try {
        
        const token = Bearer_token.split(' ')[1]
        const decodeToken = jwt.verify(token,process.env.secretKey_JWT);
        req.user = decodeToken;

        req.token = token
        console.log(req.token ,req.user)
        next()

    } catch (error) {
       return res.status(500).send(error) 
    }
    
}

const verifyRole = (allowedRoles)=>{
    return (req,res,next)=>{
        try {
            const role = req.user.Role;
            if(allowedRoles.includes(role)){
                return next()
            }
            res.status(403).json({
                message: "Access denied. Insufficient permissions."
            });
        } catch (error) {
            res.status(500).json({
                message: "Internal server error.",
                error: error.message
            });
        }
    }
    

}



module.exports = {verifyToken,verifyRole};
