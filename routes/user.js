const express=  require('express');
const router = express.Router();
const User =  require('../models/user');
const passport = require('passport');
const flash = require('connect-flash');
const catchasync =require('../utils/catchasync');
router.use(flash());

router.get('/register',(req,res)=>{
    res.render('user/register');
});

router.post('/register',catchasync(async(req,res)=>{
    //res.send(req.body);
    try{const { email , username , password} = req.body;
    const user = new User({ email, username});
    const registereduser = await User.register(user, password);
    //console.log(registereduser);
    req.login(registereduser , err =>{
        if(err) return next(err);
        req.flash('success',`Welcome to Yelpcam ${registereduser.username} !`);
        res.redirect('/campgrounds');

    })
   
       } catch(e){
           req.flash('error',e.message);
           res.redirect('register');
       }
    
}));

router.get('/login',(req,res)=>{
    res.render('user/login');
});
router.post('/login',passport.authenticate('local',{failureFlash : true,failureRedirect : '/login'}),async(req,res)=>{
    req.flash('success' , `Welcome Back ${req.user.username}`);
    const redirecturl = req.session.returnTo || '/campgrounds';
    delete req.session.returnTo;
    res.redirect(redirecturl);

});

router.get('/logout',(req,res)=>{
req.logout();
req.flash('success','Bye !')
res.redirect('/campgrounds');
})

module.exports = router ;