const express = require('express')
const expressSanitizer = require("express-sanitizer");
const morgan = require('morgan')
const path = require('path')
const app = express()
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')

const https = require("https");
const fs = require("fs");

const options = {
    key: fs.readFileSync("./config/cert.key"),
    cert: fs.readFileSync("./config/cert.crt"),
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(expressSanitizer());
app.use("/", express.static("public"));
app.use('/ko_drink', express.static(path.join(__dirname, 'ko_drink')));

const PORT = 8000;

app.set('port', process.env.PORT || 8000)
app.use(morgan('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

// mongoose configuration
const mongoose = require("mongoose")
mongoose.connect("mongodb://192.168.1.56:27017/drink")

var main = require('./routes/main.js')
app.use('/', main)

// app.listen(app.get('port'), () => {
//     console.log('8000 Port: Server Started~!!')
// });

// https 의존성으로 certificate와 private key로 새로운 서버를 시작
https.createServer(options, app).listen(8000, () => {
    console.log(`HTTPS server started on port 8000`);
});