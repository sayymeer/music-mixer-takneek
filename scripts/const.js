import dotenv from "dotenv"
dotenv.config()

export const clientId = process.env.CLIENT_ID
export const clientSecret = process.env.CLIENT_SECRET
export const redirectUri = process.env.REDIRECT_URI
export const dbUser = process.env.DB_USER
export const dbPass = process.env.DB_PASS
export const dbUri = `mongodb+srv://${dbUser}:${dbPass}@cluster0.15afeeb.mongodb.net/?retryWrites=true&w=majority`