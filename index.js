const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");

const port = process.env.PORT || 5000;

// Middleware api
app.use(cors());
app.use(express.json());

// connect mongodb

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.stpdj.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const mobileDataCollection = client.db("mobileDb").collection("mobileData");
    const reviewsCollection = client.db("mobileDb").collection("reviews");

    app.get("/mobile-data", async (req, res) => {
      const result = await mobileDataCollection.find({}).toArray();
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log("connected to mongodb.You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("mobile server is running");
});

app.listen(port, () => {
  console.log(`mobile server is running at ${port}`);
});
