import dotenv from "dotenv"
dotenv.config()

export const clientId = process.env.CLIENT_ID
export const clientSecret = process.env.CLIENT_SECRET
export const redirectUri = "http://localhost:3000/authorize"
export const dbUser = process.env.DB_USER
export const dbPass = process.env.DB_PASS
export const dbUri = `mongodb+srv://${dbUser}:${dbPass}@cluster0.15afeeb.mongodb.net/?retryWrites=true&w=majority`
export const sessionSecret = process.env.SECRET
export const cookieTime = 30*24*60*60*1000