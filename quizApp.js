const path = require("path");

/* MongoDB Things */
require("dotenv").config({
   path: path.resolve(__dirname, ".env"),
});

const { MongoClient, ServerApiVersion } = require("mongodb");
const databaseName = "CMSC335Final"
const collectionName = "leaderboardData"
const uri = process.env.MONGO_CONNECTION_STRING
const client = new MongoClient(uri, {serverApi: ServerApiVersion.v1});

/* Express Things */
const express = require('express')
const app = express()
const bodyParser = require("body-parser");
const port = 5000
const quiz = require("./routes/quiz");

/* Create Webserver With Express */
app.set("view engine", "ejs")
app.set("views", path.resolve(__dirname, "views"));
app.use(bodyParser.urlencoded({extended:false}));

/* Use folders for css/images and router endpoints */
app.use(express.static('public'));
app.use("/quiz", quiz);

/* Express Functions */
app.get("/", (req, res) => {
    res.render("landingPage")
})

app.get("/categoryList.ejs", (req, res) => {
    res.render("categoryList")
})

app.get("/leaderboard.ejs", (req, res) => {
    (async() => {
      try {
        await client.connect();
        const collection = client.db(databaseName).collection(collectionName)
        let top_scores = await collection.find({}).sort({score: -1}).limit(5).toArray()
        
        let rawHTML = ""
        top_scores.forEach((element) => {
            rawHTML += `<tr><td>${element.username}</td><td>${element.score}/20</td></tr>`
        })

        res.render("leaderboard", {rawHTML})
      }
      catch(e) {
        console.error(e)
      }
    })();
})

app.listen(port);
console.log(`\nWeb server is running at http://localhost:${port}`);

process.stdin.setEncoding("utf8")
process.stdout.write('\nWrite stop to shutdown the server: ')
process.stdin.on("readable", function () {
    const userInput = process.stdin.read()
    if (userInput !== null) {
         let cmd = userInput.trim().toLowerCase()

         if (cmd === "stop") {
            process.stdout.write("Shutting down the server\n")
            process.exit(0)
         }
         else {
            process.stdout.write(`Invalid Command: ${cmd}\n`)
         }
        process.stdin.resume()
    }
})
