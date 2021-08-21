const express = require('express');
const app = express();
const axios = require('axios');
const path = require('path')

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));

const config = async () => {
    const tool = await axios.get('https://api.themoviedb.org/3/configuration?api_key=85f4e309aef16b676f58113671a92502');
}
config();



app.get('/', async (req, res) => {
    res.send('Home');
});

app.get('/movies', async (req, res) => {
    const discover = await axios.get('https://api.themoviedb.org/3/discover/movie?api_key=85f4e309aef16b676f58113671a92502&language=en-US&region=US&include_adult=false&include_video=false&page=1&with_watch_monetization_types=flatrate');
    const movies = discover.data.results;
    res.render('template', { movies })
});

app.listen(3000, () => {
    console.log('Listening on Port 3000');
});