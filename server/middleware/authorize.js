const jwt = require('jsonwebtoken');
var fs = require('fs');
var secret = JSON.parse(fs.readFileSync('./config.json')).secret;

module.exports = (req, res, next) => {
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    if(token){
        jwt.verify(token, secret, (err, decoded) => {
            if(err) { //Could not verify
                return res.json({'error': err});
            }

            req.decoded = decoded;
            next();
        });
    }else{
        //forbidden without token
        return res.status(403).send({
            'error': 'Requires token'
        });
    }
}