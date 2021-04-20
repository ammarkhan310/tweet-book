var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');

const Logins = require('../models/login_model');
const Users = require('../models/user_model');

router.post('/updateuser', (req, res) => {
    bcrypt.hash(req.body.password,10).then(hash => {
        Users.findById(req.decoded.userId).then(user => {
            if(!user){
                return res.status(401).json({
                    message:error
                });
            }

            //update and save user
            user.name = {
                first: req.body.first,
                last: req.body.last
            }
            user.save().then(response => {
                console.log(user);
                //avoid saving passwords that are empty strings.
                if(req.body.password !== ''){
                    //find, update and save login
                    Logins.findOne({user_id: user._id}).then(login => {
                        login.password = hash;
                        login.save().then(response => {
                            res.status(201).json({
                                message: "Success"
                            });
                        }).catch(err => {
                            res.status(500).json({
                                message: 'Could not save login'
                            });
                        });
                    });
                }else{
                    res.status(201).json({
                        message: "Success"
                    });
                }
            }).catch(err => {
                res.status(500).json({
                    message: "Could not save user"
                });
            });


            console.log(user);

        });
    });
});

module.exports = router;