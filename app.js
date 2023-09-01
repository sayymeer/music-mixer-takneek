import express from "express";
import dotenv from "dotenv";
import SpotifyWebApi from "spotify-web-api-node";
import {} from "mongoose"
import { scopes } from "./scripts/scopes.js";
dotenv.config()


const app = express()
const port = process.env.PORT || 3000

const clientId = process.env.CLIENT_ID
const clientSecret = process.env.CLIENT_SECRET
const redirectUri = process.env.REDIRECT_URI
const dbUser = process.env.DB_USER
const dbPass = process.env.DB_PASS
const dbUri = `mongodb+srv://${dbUser}:${dbPass}@cluster0.15afeeb.mongodb.net/?retryWrites=true&w=majority`

const spotifyApi = new SpotifyWebApi({
    clientId: clientId,
    clientSecret: clientSecret,
    redirectUri: redirectUri
  });

app.get('/login', function(req, res) {
    res.redirect(spotifyApi.createAuthorizeURL(scopes))
});

app.get('/authorize',(req,res)=>{
    const code = req.query.code
    spotifyApi.authorizationCodeGrant(code,(err,data)=>{
        if (!err) {
            res.send(data)
        }
        console.log(err.message)
    })
})

spotifyApi.getAccessToken()
app.listen(port, ()=>console.log(`Server started at ${port}`))  