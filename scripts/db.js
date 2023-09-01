import { dbUri } from "./const.js"
import { connect,model } from "mongoose"
import { userSchema } from "./schema.js"

async function main(){
    await connect(dbUri)
}

main().then(()=>console.log("Connected to DB")).catch(err => console.log(err.message))

const User = model('User',userSchema)

export async function mainUser(id,accessToken,refreshToken){
    const user = await User.findOne({id:id})
    let dbid
    if (user) {
        user.access_token=accessToken
        user.refresh_token=refreshToken
        dbid = user._id
        user.save()
    } else {
        await User.create({id:id,access_token:accessToken,refresh_token:refreshToken})
    }
    return dbid
}

export async function userByDbId(id){
    const user = await User.findById(id)
    return [user.id,user.access_token,user.refresh_token]
}

export async function updateUserbyId(id,accessToken,refreshToken){
    const user = await User.findById(id)
    user.access_token = accessToken
    if (refreshToken) {
        user.refresh_token = refreshToken
    }
    await user.save()
}