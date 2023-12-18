import express from "express";
import SpotifyWebApi from "spotify-web-api-node";
import { scopes } from "./scripts/scopes.js";
import { clientId,clientSecret,cookieTime,redirectUri, sessionSecret } from "./scripts/const.js";
import { mainUser, updateUserbyId, userByDbId } from "./scripts/db.js";
import cors from "cors"
import session from "express-session"

const app = express()
app.use(cors())
app.use(express.json())
app.set('view engine', 'ejs');
app.use(express.static('public'))
app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie: {maxAge:cookieTime}
}))
const port = process.env.PORT || 8080


const spotifyApi = new SpotifyWebApi({
    clientId: clientId,
    clientSecret: clientSecret,
    redirectUri: redirectUri
});

app.get('/',async (req,res)=>{
    if (req.session.dbid) {
        const startTime = Date.now()
        const dbid = req.session.dbid
        const topTrackss = await topTracksWithImage(dbid)
        // const topArtist =  topArtistWithImage(dbid)
        // const topGenreee =  topGenree(dbid)
        // const featuredPlaylistt =  featuredPlaylist(dbid)
        // const recommendedSongs =  recommendedTracksWithImage(dbid,topTrackss)
        const [topArtist,topGenreee,featuredPlaylistt,recommendedSongs] = await Promise.all([topArtistWithImage(dbid),topGenree(dbid),featuredPlaylist(dbid),recommendedTracksWithImage(dbid,topTrackss)])
        if (!topArtist || !topGenree || ! topTrackss || !recommendedSongs || !featuredPlaylistt ) {
            return res.send("Somer error occured please reload")
        }
        res.render('home',{topArtist:topArtist,topGenre:topGenreee,topTracks:topTrackss,recommendedSongs:recommendedSongs,featuredPlaylist:featuredPlaylistt})
        console.log("Time elapsed for this request is ", (Date.now()-startTime)/1000, " seconds")
    } else {
        res.render('logged')
    }
})

app.get('/refresh',async (req,res)=>{
    if (req.session.dbid) {
        const dbid = req.session.dbid
        const tracks = await topTracksWithImage(dbid)
        const recommendedSongs =await recommendedTracksWithImage(dbid,tracks)
        if (!recommendedSongs) {
            return res.send(400)
        }
        res.json(recommendedSongs)
    } else {
        res.send(400)
    }
})

app.get('/mytoken',(req,res)=>{
    if (req.session.dbid) {
        res.send(`Your Access token is - <i> ${req.session.dbid} </i>`)
    } else {
        res.redirect('/')
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
                mainUser(id,accessToken,refreshToken).then(data => {
                    req.session.dbid = data
                    res.redirect('/')
                }).catch(err => console.log(err.message))
            }).catch(err => console.log(err))
            return
        }
        console.log(err)
    })
})

// Api for favorite Artists
app.post('/api/favorite/artists',async (req,res) => {
    if (!req.body.token) {
        return res.status(400).send("Send your token")
    }
    const dbId = req.body.token
    const limit = 5
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

// Api for favorite Genre
app.post('/api/favorite/genre',async (req,res)=>{
    if (!req.body.token) {
        return res.status(400).send("Send your token")
    }
    const dbId = req.body.token
    const limit = 5
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

// Api for favorite Tracks
app.post('/api/favorite/tracks',async (req,res) => {
    const response = []
    if (!req.body.token) {
        return res.status(400).send("Send your token")
    }
    const dbId = req.body.token
    const limit = 5
    if (limit) {
        if(limit>50){return res.status(400).send("Limit must be less than 50")}
        if(limit<1){return res.status(400).send("Limit must be greater than 1")}
    }
    try {
        const [id,accessToken,refreshToken] = await userByDbId(dbId)
        spotifyApi.setAccessToken(accessToken)
        spotifyApi.setRefreshToken(refreshToken)
        const data = await spotifyApi.refreshAccessToken()
        await updateUserbyId(dbId,data.body.access_token,data.body.refresh_token)
        spotifyApi.setAccessToken(data.body.access_token)
        const TopTracks = await spotifyApi.getMyTopTracks({time_range:"short_term",limit:limit})
        TopTracks.body.items.forEach(item => {
            response.push(item.name)
        })
        return res.json(response)
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

async function topArtistWithImage(dbid){
    const [id,accessToken,refreshToken] = await userByDbId(dbid)
    const response = []
    spotifyApi.setAccessToken(accessToken)
    spotifyApi.setRefreshToken(refreshToken)
    const data = await spotifyApi.refreshAccessToken()
    await updateUserbyId(dbid,data.body.access_token,data.body.refresh_token)
    spotifyApi.setAccessToken(data.body.access_token)
    const topArtist = await spotifyApi.getMyTopArtists({time_range:"short_term",limit:5})
    topArtist.body.items.forEach(item => {
        const img = item.images[0]
        const name = item.name
        response.push({img:img,name:name,id:item.id})
    })
    return response
}

async function topGenree(dbid){
    const topGenre = []
    try {
        const TopArtist = await topArtists(dbid,50)
        TopArtist.body.items.forEach(item => {
            topGenre.push(...item.genres)
        })
        const response = Array.from(new Set(sortByFreq(topGenre)))
        return response.slice(0,5)
    } catch (error) {
        console.log(error)
    }   
}

async function topTracksWithImage(dbid){
    const response = []
    try {
        const [id,accessToken,refreshToken] = await userByDbId(dbid)
        spotifyApi.setAccessToken(accessToken)
        spotifyApi.setRefreshToken(refreshToken)
        const data = await spotifyApi.refreshAccessToken()
        await updateUserbyId(dbid,data.body.access_token,data.body.refresh_token)
        spotifyApi.setAccessToken(data.body.access_token)
        const TopTracks = await spotifyApi.getMyTopTracks({time_range:"short_term",limit:5})
        TopTracks.body.items.forEach(item => {
            response.push({name:item.name,img:item.album.images[0].url,id:item.id,url:item.uri})
        })
        return response
    } catch (error) {
        console.log(error)
    }
}

async function recommendedTracksWithImage(dbid,track){
    const response = []
    const tracks = []
    track.forEach(t => {
        tracks.push(t.id)
    })
    try{
        const [id,accessToken,refreshToken] = await userByDbId(dbid)
        spotifyApi.setAccessToken(accessToken)
        spotifyApi.setRefreshToken(refreshToken)
        const data = await spotifyApi.refreshAccessToken()
        await updateUserbyId(dbid,data.body.access_token,data.body.refresh_token)
        spotifyApi.setAccessToken(data.body.access_token)
        const recommendedSongs = await spotifyApi.getRecommendations({limit:5,seed_tracks:tracks.join(',')})
        recommendedSongs.body.tracks.forEach(track => {
            response.push({name:track.name,img:track.album.images[0],url:track.uri,artist:track.artists[0].name})
        })
        return response
    } catch (err) {
        console.log(err)
    }
}

async function featuredPlaylist(dbid){
    try {
        const [id,accessToken,refreshToken] = await userByDbId(dbid)
        spotifyApi.setAccessToken(accessToken)
        spotifyApi.setRefreshToken(refreshToken)
        const data = await spotifyApi.refreshAccessToken()
        await updateUserbyId(dbid,data.body.access_token,data.body.refresh_token)
        spotifyApi.setAccessToken(data.body.access_token)
        const featuredPlaylist = await spotifyApi.getFeaturedPlaylists({limit:1})
        const playlist = featuredPlaylist.body.playlists.items[Math.floor(Math.random()*featuredPlaylist.body.playlists.items.length)]
        return {id:playlist.id,name:playlist.name,img:playlist.images[0]}
    } catch (error) {
        console.log(error)
    }
}