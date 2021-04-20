const mongoose=require('mongoose');
const Schema = mongoose.Schema;
const Review  = require('./reviews');
const User = require('./user');


const imageschema = new Schema({
    
        url : String,
        filename :String
 
}) ;
imageschema.virtual('thumbnail').get(function(){
    return this.url.replace('/upload','/upload/w_200');
});


const campgroundschema = new Schema({
    title :{
        type : String,
        required : true
    },
    price : {
        type : Number,
        required : true
    },
    description :{
        type : String,
        required : true
    },
    // 
    geometry : {
        type : {
            type : String,
            enum : ['Point'],
            required : true
        },
        coordinates : {
            type : [Number],
            required: true
        }
    },
    location : {
        type : String,
        required :true
    },
    image : [imageschema],
    
    reviews : [{
        type : Schema.Types.ObjectId,
        ref : 'Review'
    }],
    author : {
        type: Schema.Types.ObjectId,
        ref : 'User'
    }
});

campgroundschema.post('findOneAndDelete' , async function(doc){    // WORKS ONLY WHEN CAMP IS GETTING DELETED BY DELETEN=MANY ROUTE 
    //console.log(doc);
    if(doc){
        await Review.deleteMany({
            _id : {
                $in : doc.reviews
            }
        })
    }

})



const Campground = mongoose.model('Campground',campgroundschema);
module.exports = Campground;
