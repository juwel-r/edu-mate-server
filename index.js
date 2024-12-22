require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.USER_ID}:${process.env.PASSWORD}@cluster0.hjkzu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// const uri = "mongodb://localhost:27017";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const tutorials = client.db("Edu_Mate").collection("tutorials");
    const bookedTutorials = client
      .db("Edu_Mate")
      .collection("booked_tutorials");

    app.post("/add-tutorial",async (req, res) => {
      const tutorialData = req.body;
      const result =await tutorials.insertOne(tutorialData);
      console.log(result);
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Edu_Mate server in running!");
});
app.listen(port, () => {
  console.log("Server is running on: ", port);
});
