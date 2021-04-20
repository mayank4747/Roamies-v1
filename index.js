if(process.env.NODE_ENV !== "production"){
    require('dotenv').config();
}


require('dotenv').config();
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({accessToken:mapBoxToken});
const express =require('express');
const app=express();
const path=require('path');
const catchasync = require('./utils/catchasync');
const ExpressError= require('./utils/ExpressError');
const mongoose=require('mongoose');
const ejsmate= require('ejs-mate');
const Joi= require('joi');
const Campground = require('./models/campground');
const Review = require('./models/reviews');
const methodoverride=require('method-override');
const { join } = require('path');
const { isNumber } = require('util');
const session = require('express-session');
const { storage } =  require('./cloudinary');
const multer  = require('multer');
const upload = multer({ storage });
const flash = require('connect-flash');
const passport = require('passport');
const Localstrategy = require('passport-local');
const User = require('./models/user');
const { cloudinary } = require('./cloudinary');
const mongoSanitize = require('express-mongo-sanitize');

const userRoute = require('./routes/user');
const { isloggedin, validatecamp , validatereview ,isauthor , isReviewauthor } = require('./middleware');
const reviews = require('./controllers/reviews');
const db_url = process.env.DB_URL;
//mongodb://localhost:27017/yelp-cam
mongoose.connect(db_url, {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex : true})
.then(()=>{
    console.log("Yelpcam Connected to database");
})
.catch(err =>{
    console.log("Connection error Mongoose")
    console.log(err);
});















//You can  put all routes to separate files if you want using express-router





app.engine('ejs',ejsmate);
app.set('view engine','ejs');
app.use(express.static(path.join(__dirname,'public')));// TO SERVE DIRECTORY PUBLIC
app.set('views',path.join(__dirname,'/views'));
app.use(express.urlencoded({ extended: true })); // for parsing the form data
app.use(express.json());


app.use(methodoverride('_method'));
app.use(mongoSanitize());
const MongoStore = require('connect-mongo');

// app.use(session({
//     secret: 'foo',
//     store: MongoStore.create(options)
//   }));

const store = MongoStore.create({
    mongoUrl: db_url,
    touchAfter: 24 * 60 * 60,
    crypto: {
        secret: 'squirrel'
    }
});
 store.on("error",function(e){
     console.log("session error",e);
 })





const sessionConfig = {
    store,
    name : 'Makarov',
    secret: 'thisisabiggestsecret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig))
app.use(flash());


app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new Localstrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});



app.use('/',userRoute);

app.get('/',(req,res)=>{
    res.render('home');
});


app.get('/fakeuser',async(req,res)=>{
    const user = new User({email : 'hello@gamil.com', username : 'hiya'});
    const newuser = await User.register(user , 'hello123');
    res.send(newuser);
})

app.get('/makecamp', catchasync(async (req,res) => {
    const camp = new Campground({title : 'My Backyard',price : 55, description : 'Very cheap but nice !', location :'hawaii'});
     await camp.save();
     res.send(camp);
}));

app.get('/campgrounds',catchasync(async (req, res)=>{
    const camps = await Campground.find({});
    res.render('campgrounds/index',{ camps });
}));



app.get('/campgrounds/new' ,isloggedin, (req, res)=>{
    
    res.render('campgrounds/new');
});

app.post('/campgrounds',upload.array('image'),validatecamp, catchasync(async (req,res,next)=>{
    const newcamp= new Campground(req.body.Campground);
    const geoData = await geocoder.forwardGeocode({
        query : req.body.Campground.location,
        limit : 1
    }).send()
    


    //const newcamp= new Campground(req.body.Campground);
    newcamp.author = req.user._id;
    newcamp.image =req.files.map(f=> ({ url : f.path , filename : f.filename}));
    newcamp.geometry = geoData.body.features[0].geometry;
    //.send(req.body);

     await newcamp.save();
     console.log(newcamp);
     req.flash('success','Successfully made the Camp ');
     res.redirect(`/campgrounds/${newcamp._id}`);
})
   
        
    
);





app.get('/campgrounds/:id',catchasync( async (req,res)=>{
    const camp = await (await Campground.findById(req.params.id).populate({path:'reviews',populate : { path :'author'}}).populate('author'));

    //console.log(camp);
    if(!camp){
        req.flash('error',' Cannot Find That Campground ');   
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/show',{ camp });
}));

app.get('/campgrounds/:id/edit',isloggedin,isauthor, catchasync(async (req,res)=>{
    const { id }= req.params;
    
      const camp =  await Campground.findById(id) ;
      res.render('campgrounds/edit' , {camp} );
}));

app.put('/campgrounds/:id',isauthor,isloggedin,upload.array('image'),validatecamp, catchasync(async (req, res)=>{
    const { id } = req.params;
    //console.log(req.body);
    //res.send("put !!1");
    const camp = await Campground.findById(req.params.id);
    
    const imgs  = req.files.map(f=> ({ url : f.path , filename : f.filename}));
    const campi = await (await Campground.findByIdAndUpdate(id , req.body.Campground,{runValidators : true , new : true}));
    camp.image.push(...imgs);
    
    if(req.body.deleteImages){
        for(let filename of req.body.deleteImages){
            await cloudinary.uploader.destroy(filename);
        }
       await  camp.updateOne({$pull: { image : {filename : { $in : req.body.deleteImages}}}});
       console.log(camp);
    }
    await camp.save();
    req.flash('success','Campground Updated');
    res.redirect(`/campgrounds/${campi._id}`);
}));
app.delete('/campgrounds/:id',isauthor, catchasync(async(req, res)=>{
    const { id } = req.params;
    const campg = await Campground.findById(req.params.id);
    
     const camp = await Campground.findByIdAndDelete(id);
     req.flash('success','Campground Deleted');
     res.redirect('/campgrounds');
    
}));

app.post('/campgrounds/:id/reviews' ,validatereview,isloggedin, catchasync(reviews.makereview));;
app.delete('/campgrounds/:id/reviews/:reviewid',isloggedin,isReviewauthor,catchasync(async(req,res)=>{
    const { id , reviewid } =  req.params;
    const review = await Review.findByIdAndDelete(reviewid);
    await  Campground.findByIdAndUpdate(id , { $pull :{reviews : reviewid}});
    req.flash('success','Review Deleted ')
    res.redirect(`/campgrounds/${id}`);

}))

















app.all('*',(req,res,err)=>{
    // res.send("404!!!!");
     next(new ExpressError('Page Not Found' , 404));
})





app.use((err,req,res,next)=>{
    // res.send("oh boy ! Something went Wrong ");
    const{ statuscode = 500  } = err;
    if(!err.message){message ='Ohh No Something Went Wrong !'}
    res.status(statuscode).render('error' , { err });
})





app.listen(3000,()=>{
    console.log("listening to roamies 3000");
})