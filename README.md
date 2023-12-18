# Spotify Music Mixer

This Site is live at <https://music-mixer.onrender.com/>

## Disclaimer

We have used Spotify Web API for getting user information like recently played, top artists, top tracks and to recommend songs based on user's spotify data. Due to API restrication (App in Development Mode) it is required that your email id is registered in our spotify developer dashboard. So please provide your email id before using our webapp.

## Running the App

Clone the repo and go the repo folder and run the following commands.

### Docker

```bash
// Build docker image
docker build . -t <your username>/music-mixer

// Run the docker image
docker run -p 8080:8080 -d <your username>/music-mixer

//Now you can send Request to server using Thunder client or Postman or you can run cli.py and enter the port number to play the game.

```

### W/O Docker

```bash
npm install
node app.js
```

## API

There are three api endpoints which are specified below. To get your token visit `https://music-mixer.onrender.com/mytoken` after logging in.

1. `POST https://music-mixer.onrender.com/api/favorite/artists` : Request body will have parameters `token`. for e.g.

    ```jsonc
    {
        "token":"dfjakf3124a", // This will be provided to you when you login to Music Mixer and go to /mytoken
    }
    ```

    In response you will get a ranked list of name of 5 artists

2. `POST https://music-mixer.onrender.com/api/favorite/tracks` : Request body will have parameters `token`. for e.g.

    ```jsonc
    {
        "token":"dfjakf3124a", // This will be provided to you when you login to Music Mixer and go to /mytoken
    }
    ```

    In response you will get a ranked list of name of 5 tracks

3. `POST https://music-mixer.onrender.com/api/favorite/genre` : Request body will have parameters `token`. for e.g.

    ```jsonc
    {
        "token":"dfjakf3124a", // This will be provided to you when you login to Music Mixer and go to /mytoken
    }
    ```

    In response you will get a ranked list of your top 5 genre.

## Documentation

Our backend is written in Javascript(NodeJS) and uses MongoDB to store database. We have used majorly following modules/packages in our backend.

1. **express** - To handle GET and POST requests and to provide responses.
2. **mongoose** - To store and access data that is stored in MongoDB.
3. **spotify-web-api-node** - To make requests to spotify server and to retrieve data.
4. **express-session** - To store and handle sessions.
5. **ejs** - To render pages on server side and then send it to user.

When you click on Login with Spotify, a code is generated which is send to backend and we get `access_token` and `refresh_token`. Both the tokens are stored in our DB. Now we can use `access_token` to make request to Spotify on behalf of that user. `access_token` will expire in some time. When the `access_token` expires, we can use `refresh_token` to get new `access_token` and both will be updated in our Database.

Recommended Songs are generated on basis of your top 5 recently played songs from past month. We use spotify api to generate recommended songs. Recommended songs are refreshed when you refresh the web page.
