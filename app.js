import express from "express";
import SpotifyWebApi from "spotify-web-api-node";
import { scopes } from "./scripts/scopes.js";
import { clientId,clientSecret,redirectUri } from "./scripts/const.js";
import { mainUser, updateUserbyId, userByDbId } from "./scripts/db.js";
import cors from "cors"

const app = express()
app.use(cors())
app.use(express.json())
const port = process.env.PORT || 3000

const spotifyApi = new SpotifyWebApi({
    clientId: clientId,
    clientSecret: clientSecret,
    redirectUri: redirectUri
});

app.get('/',(req,res)=>{
    if (req.session.id) {
        
    } else {
        
    }
})

app.get('/login', function(req, res) {
    res.redirect(spotifyApi.createAuthorizeURL(scopes))
});

app.get('/authorize',(req,res)=>{
    const code = req.query.code
    spotifyApi.authorizationCodeGrant(code,(err,data)=>{
        if (!err) {
            const accessToken = data.body.access_token
            const refreshToken = data.body.refresh_token
            spotifyApi.setAccessToken(accessToken)
            spotifyApi.getMe().then((data)=>{
                const id = data.body.id
                mainUser(id,accessToken,refreshToken).then(console.log("User Authorized")).catch(err => console.log(err.message))
            }).catch(err => console.log(err))
            return
        }
        console.log(err)
    })
})

app.post('/api/favorite/artists',async (req,res) => {
    if (!req.body.token) {
        return res.status(400).send("Send your token")
    }
    const dbId = req.body.token
    const limit = req.body.limit
    const response = []
    if (limit) {
        if(limit>50){return res.status(400).send("Limit must be less than 50")}
        if(limit<1){return res.status(400).send("Limit must be greater than 1")}
    }
    try {
        const TopArtist = await topArtists(dbId,limit)
        TopArtist.body.items.forEach(artist => {
            response.push(artist.name)
        })
        return res.json(response)
    } catch (error) {
        return res.status(400).send(error)
    }
})

app.post('/api/favorite/genre',async (req,res)=>{
    if (!req.body.token) {
        return res.status(400).send("Send your token")
    }
    const dbId = req.body.token
    const limit = req.body.limit
    if (limit && (limit<1 || limit>10)) {
        return res.status(400).send("Limit must be in range 1 to 10")
    }
    const topGenre = []
    try {
        const TopArtist = await topArtists(dbId,50)
        TopArtist.body.items.forEach(item => {
            topGenre.push(...item.genres)
        })
        const response = Array.from(new Set(sortByFreq(topGenre)))
        return res.json(response.slice(0,limit||5))
    } catch (error) {
        return res.status(400).send(error)
    }
})


app.listen(port, ()=>console.log(`Server started at ${port}`))

async function topArtists(dbId,limit){
    const [id,accessToken,refreshToken] = await userByDbId(dbId)
    spotifyApi.setAccessToken(accessToken)
    spotifyApi.setRefreshToken(refreshToken)
    const data = await spotifyApi.refreshAccessToken()
    await updateUserbyId(dbId,data.body.access_token,data.body.refresh_token)
    spotifyApi.setAccessToken(data.body.access_token)
    const TopArtist = await spotifyApi.getMyTopArtists({time_range:"short_term",limit:limit})
    return TopArtist
}

function sortByFreq(arr){
    const freqMap = {}
    arr.forEach(el => {
        if (freqMap[el]) {
            freqMap[el]++
        } else {
            freqMap[el] = 1
        }
    })
    arr.sort((a,b) => freqMap[b]-freqMap[a])
    return arr
}