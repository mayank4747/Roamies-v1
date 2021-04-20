
const ExpressError= require('./utils/ExpressError');
const Campground = require('./models/campground');
const Review = require('./models/reviews');
const BaseJoi= require('joi');
const sanitizeHtml = require('sanitize-html');

const extension = (joi) => ({
    type: 'string',
    base: joi.string(),
    messages: {
        'string.escapeHTML': '{{#label}} must not include HTML!'
    },
    rules: {
        escapeHTML: {
            validate(value, helpers) {
                const clean = sanitizeHtml(value, {
                    allowedTags: [],
                    allowedAttributes: {},
                });
                if (clean !== value) return helpers.error('string.escapeHTML', { value })
                return clean;
            }
        }
    }
});
const Joi = BaseJoi.extend(extension)





module.exports.isloggedin = (req,res,next)=>{
    //console.log(req.user);
    if(!req.isAuthenticated()){
        req.session.returnTo = req.originalUrl; 
        req.flash('error','You must be signed in');
        res.redirect('/login');
    }
    next();
};


module.exports.validatecamp= (req,res,next) =>{
    const campgroundschema = Joi.object({
        Campground : Joi.object({
            title : Joi.string().required().escapeHTML(),
            price : Joi.number().required().min(0),
            location : Joi.string().required().escapeHTML(),
            //image : Joi.string().required(),
            description : Joi.string().required().escapeHTML()
        }).required(),
        deleteImages : Joi.array()
         
    });
       const { error } = campgroundschema.validate(req.body);
    if(error) {
        const msg=error.details.map(el => el.message).join(',');
        throw new ExpressError(msg , 400);
    } else{
        next();
    }
    };

module.exports.validatereview = (req,res,next) =>{
    
        const reviewschema = Joi.object({
            Review : Joi.object({
                body : Joi.string().required().escapeHTML(),
                rating : Joi.number().required().min(0).max(5)
    
            }).required()
        });
        const { error } = reviewschema.validate(req.body);
    if(error) {
        const msg=error.details.map(el => el.message).join(',');
        throw new ExpressError(msg , 400);
    } else{
        next();
    }

};   
module.exports.isauthor = async(req,res,next)=>{
    const { id } =  req.params;
    const campg = await Campground.findById(id);
    if(!campg.author.equals(req.user._id)){
        req.flash('error','You are not allowed to do that Babes  !')
        res.redirect(`/campgrounds/${id}`);
    }
    next();

} ;
module.exports.isReviewauthor = async(req,res,next)=>{
    const { id , reviewid } =  req.params;
    //const campg = await Campground.findById(id);
    const review  = await Review.findById(reviewid);
    if(!review.author.equals(req.user._id)){
        req.flash('error','You are not allowed to do that Babes  !')
        res.redirect(`/campgrounds/${id}`);
    }
    next();

} ;
