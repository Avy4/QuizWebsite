const path = require("path");

/* May be way to make this not global */
let globalIsRanked
let globalUsername

/* MongoDB Things */
require("dotenv").config({
   path: path.resolve(__dirname, ".env"),
});

const { MongoClient, ServerApiVersion } = require("mongodb")
const mongoose = require("mongoose")
const databaseName = "CMSC335Final"
const collectionName = "leaderboardData"
const uri = process.env.MONGO_CONNECTION_STRING
const client = new MongoClient(uri, {serverApi: ServerApiVersion.v1})

const scoreSchema = new mongoose.Schema({
    username: String,
    score: Number,
})

const Score = mongoose.model("Score", scoreSchema, collectionName)

/* Express Things */
const express = require('express');
const router = express.Router();

/* Use folders for css/images and router endpoints */
router.use(express.static('public'));

/* Quiz Related Express Functions */
router.get("/", (req, res) => {
    res.render("landingPage")
})

router.get("/quizSetup.ejs", (req, res) => {
    res.render("quizSetup")
})

router.post("/quizSetup.ejs", (req, res) => {
    let api = "https://opentdb.com/api.php?"
    let {difficulty, num_questions, ranked_option, user} = req.body
    globalUsername = user
    globalIsRanked = ranked_option

    if (ranked_option === "on") {
        difficulty = "hard"
        num_questions = 20
    }

    let url=`${api}amount=${num_questions}&difficulty=${difficulty}&type=multiple`
    get_questions(url).then((questionHTML) => {
        res.render("quizPage", {questionHTML})
    })
})

router.post("/quizPage.ejs", (req, res) => {
    const values = Object.values(req.body)
    const len = values.length

    let total_correct = 0
    values.forEach((v) => {
        total_correct += Number(v)
    })

    if (globalIsRanked === "on") {
        (async() => {
            try {
                await mongoose.connect(process.env.MONGO_CONNECTION_STRING, {
                    dbName: databaseName
                });

                let newScore = new Score({
                    username: globalUsername,
                    score: total_correct,
                })
                
                await newScore.save()
            }

            catch(e) {
                console.error(e)
            }

            finally {
                client.close();
            }
        })();
    }

    res.render("scorePage", {total_correct, len})
})

/* Helper Functions */
function get_questions(link) {
    let questions = fetch(link).then(res => {
        return res.json()
    }).then(data => {
        let question_dict = data["results"]
        let e_arr = []
        question_dict.forEach(element => {
            e_arr.push({
                category: element.category,
                question: element.question,
                correct: element.correct_answer,
                answers: shuffle([...element.incorrect_answers, element.correct_answer])
            })
        })

        let html = ""
        let count = 1000
        let mod = 1
        e_arr.forEach(element => {
            html += `<fieldset>`
            html += `<p class="category">${element.category}</p>`
            html += `<p>${element.question}</p>`

            element.answers.forEach(ans => {
                let is_correct = Number(ans === element.correct)
                html += `<input required type="radio" id="${count + mod}" name="${count}" value=${is_correct}>`
                html += `<label for="${count + mod}">${ans}</label><br>`
                mod += 1
            })

            html += `</fieldset>`
            count += 1
        })

        return html
    }).catch(e => console.log(error))

    return questions
}

function shuffle(array) {
    let new_array = array
    for (let i = new_array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [new_array[i], new_array[j]] = [new_array[j], new_array[i]];
    }

    return new_array
}

module.exports = router;