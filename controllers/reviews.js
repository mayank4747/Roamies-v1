const Review = require('../models/reviews');
const Campground = require('../models/campground');

module.exports.makereview=async(req,res)=>{
    const camp = await Campground.findById(req.params.id);
    //res.send("you made it");
    const review = new Review(req.body.Review);
    camp.reviews.push(review);
    review.author = req.user._id;
    await camp.save();
    await review.save();
    req.flash('success',' Review Added ')
    res.redirect(`/campgrounds/${camp._id}`);

};