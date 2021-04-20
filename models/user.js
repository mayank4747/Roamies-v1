const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportlocalmong = require('passport-local-mongoose');

const userschema = new Schema({
    email : {
        type : String,
        required : true,
        unique : true

    }
});

userschema.plugin(passportlocalmong);
module.exports = mongoose.model('User' , userschema);