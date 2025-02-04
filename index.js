require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://edu-mate-24f55.web.app",
      "https://edu-mate-24f55.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(cookieParser());

// Verify Client Token
const tokenVerify = (req, res, next) => {
  const token = req.cookies.jwtToken;
  if (!token) return res.status(401).send({ message: "Unauthorize Access" });
  jwt.verify(token, process.env.JWT_SECRET_KEY, (error, decode) => {
    if (error) return res.status(401).send({ message: "Unauthorize Access" });
    else {
      req.user = decode;
      next();
    }
  });
};

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

    // ==============================> JWT Authentication <==============================
    // Create Token
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_SECRET_KEY, {
        expiresIn: "12h",
      });
      res
        .cookie("jwtToken", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    // Clear Token when logout
    app.post("/clear-token", (req, res) => {
      res
        .clearCookie("jwtToken", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ clearToken: true });
    });

    // ============> API <============= //
    // Create Data
    
    
    app.post("/tutorials", tokenVerify, async (req, res) => {
      const tutorialData = req.body;

      if (req.user.email !== tutorialData.email)
        return res.status(403).send({ message: "Access Forbidden" });

      const result = await tutorials.insertOne(tutorialData);
      res.send(result);
    });

    // get single data
    app.get("/tutor/:id", async (req, res) => {
      const id = req.params.id;
      const result = await tutorials.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // Get all data and by search query
    app.get("/tutorials/search", async (req, res) => {
      const search = req.query.value;
      let option = {};
      if (search) {
        option = { category: { $regex: search, $options: "i" } };
        const result = await tutorials.find(option).toArray();
        res.send(result);
      } else {
        const result = await tutorials.find().toArray();
        res.send(result);
      }
    });

    // Get Data by query (email)
    app.get("/tutorials", tokenVerify, async (req, res) => {
      const email = req.query.email;

      if (req.user.email !== email)
        return res.status(403).send({ message: "Access Forbidden" });

      if (email) {
        const result = await tutorials.find({ email: email }).toArray();
        res.send(result);
      }
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
      const result = await tutorials.updateOne({ _id: new ObjectId(id) },{$inc: { review: 1 }});
      res.send(result);
    });

    // Update Data
    app.put("/tutorials", async (req, res) => {
      const tutorialData = req.body;
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
      res.send(result);
    });

    // Booked Tutorial Section ==============================
    app.post("/booked-tutorials", async (req, res) => {
      const bookedTutorialData = req.body;
      const result = await bookedTutorials.insertOne(bookedTutorialData);
      res.send(result);
    });

    // Get data by  email query
    app.get("/booked-tutorials", tokenVerify, async (req, res) => {
      const email = req.query.email;

      if (req.user.email !== email)
        return res.status(403).send({ message: "Access Forbidden" });

      const result = await bookedTutorials
        .find({ studentEmail: email })
        .toArray();
      for (const bookedTutorial of result) {
        const tutorial = await tutorials.findOne({
          _id: new ObjectId(bookedTutorial.tutorId),
        });
        bookedTutorial.tutorName = tutorial?.name;
        bookedTutorial.review = tutorial?.review;
      }
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





