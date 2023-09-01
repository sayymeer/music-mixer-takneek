import { Schema } from "mongoose";

export const userSchema = new Schema({
    id:{
        type:String,
        required:true,
        unique:true
    },
    access_token:{
        type:String,
        required:true
    },
    refresh_token:{
        type:String,
        required:true
    }
})