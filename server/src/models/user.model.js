import mongoose from "mongoose";    

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: [true, "username already exists"],
        required: [true, "Username is required"]
    }, 
    email: {
        type: String,
        unique: [true,"Email already exists"],
        required: [true, "email is required"]
    },
    password: {
        type: String,
        required: [true, "password is required"]
    }
}, { timestamps: true});

const UserModel = mongoose.model('User', userSchema);

export default UserModel;