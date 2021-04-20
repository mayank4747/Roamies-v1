const mongoose=require('mongoose');
const Campground = require('../models/campground');
const cities= require('./cities');
const { descriptors , places } = require('./seedHelpers');


mongoose.connect('mongodb://localhost:27017/yelp-cam', {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex : true})
.then(()=>{
    console.log("Yelpcam Connected to database");
})
.catch(err =>{
    console.log("Connection error Mongoose")
    console.log(err);
});


const sample = array => array[Math.floor(Math.random()*15)];



const seeddb = async ()=>{
    await Campground.deleteMany({});
    //const c = new Campground({title : 'purple land', price : 66, description : 'beautiful place', location : 'havana'});
    for(let i = 0 ; i < 10 ; i++){
        const rannum= Math.floor(Math.random()*500);
        const camp =new Campground({
            author : '606da432e475ba0f54021934',
            location :` ${cities[rannum].city} , ${cities[rannum].state}`,
            description  : `${sample(descriptors)} `,
            price : Math.floor(Math.random()*100),
            title : `${sample(places)}`,
            geometry : { 
                type : "Point",
                coordinates : [
                    cities[rannum].longitude,
                    cities[rannum].latitude
                ]
            },
            image: [
                {
                  
                  url: 'https://res.cloudinary.com/dfguskorr/image/upload/v1617969357/Yelpcam/ead8nd7kxzxkuq0tniiq.webp',
                  filename: 'Yelpcam/ead8nd7kxzxkuq0tniiq'
                },
                {
                  
                    url: 'https://res.cloudinary.com/dfguskorr/image/upload/v1618056594/Yelpcam/rblb2qmr0bedbp7uxh5b.jpg',
                    filename: 'Yelpcam/ead8nd7kxzxkuq0tniiq'
                  }
              ]
            

        });
        await camp.save();
    }
   
}


seeddb();