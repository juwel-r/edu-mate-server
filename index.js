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

    // Create Data
    app.post("/tutorials", async (req, res) => {
      const tutorialData = req.body;
      const result = await tutorials.insertOne(tutorialData);
      console.log(result);
      res.send(result);
    });

    // Get Data
    app.get("/tutorials", async (req, res) => {
      const email = req.query.email;
      if (email) {
        const result = await tutorials.find({ email: email }).toArray();
        res.send(result);
      } else {
        const result = await tutorials.find().toArray();
        res.send(result);
      }
    });

    // get single data
    app.get("/tutor/:id", async (req, res) => {
      const id = req.params.id;
      const result = await tutorials.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // get data by category
    app.get("/tutorials/:category", async (req, res) => {
      const category = req.params.category;
      const result = await tutorials.find({ category: category }).toArray();
      res.send(result);
    });

    // Increase Review with $inc operator
    app.put("/tutorials/:id", async (req, res) => {
      const id = req.params.id;
      const result = await tutorials.updateOne(
        { _id: new ObjectId(id) },
        {
          $inc: { review: 1 },
        }
      );
      console.log(result);
      res.send(result);
    });

    // Update Data
    app.put("/tutorials", async (req, res) => {
      const tutorialData = req.body;
      console.log(tutorialData);
      const filter = { _id: new ObjectId(tutorialData._id) };
      const options = { upsert: true };
      const updateData = {
        $set: {
          name: tutorialData.name,
          email: tutorialData.email,
          photoURL: tutorialData.photoURL,
          category: tutorialData.category,
          price: tutorialData.price,
          review: tutorialData.review,
          description: tutorialData.description,
        },
      };
      const result = await tutorials.updateOne(filter, updateData, options);
      res.send(result);
    });

    // Delete Data
    app.delete("/tutorials/:id", async (req, res) => {
      const id = req.params.id;
      const result = await tutorials.deleteOne({ _id: new ObjectId(id) });
      console.log(result);
      res.send(result);
    });

    // Booked Tutorial Section ==============================
    app.post("/booked-tutorials", async (req, res) => {
      const bookedTutorialData = req.body;
      const result = await bookedTutorials.insertOne(bookedTutorialData);
      console.log(result);
      res.send(result);
    });

    // Get data by query from email
    app.get("/booked-tutorials", async (req, res) => {
      const email = req.query.email;
      const result = await bookedTutorials
        .find({ studentEmail: email })
        .toArray();
      for (const bookedTutorial of result) {
        const tutorial = await tutorials.findOne({
          _id: new ObjectId(bookedTutorial.tutorId),
        });
        bookedTutorial.tutorName = tutorial.name;
        bookedTutorial.review = tutorial.review;
      }
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
