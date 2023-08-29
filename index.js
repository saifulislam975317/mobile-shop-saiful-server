const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const port = process.env.PORT || 5000;

// Middleware api
app.use(cors());
app.use(express.json());

// middleware for secure api

const verifyJWT = (req, res, next) => {
  const authToken = req.headers.authorization;
  if (!authToken) {
    return res
      .status(401)
      .send({ error: true, message: "unauthorized access" });
  }
  const token = authToken.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ error: true, message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};

// connect mongodb
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

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
    const cartsCollection = client.db("mobileDb").collection("carts");
    const usersCollection = client.db("mobileDb").collection("users");

    // jwt api
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: "1d",
      });
      res.send({ token });
    });

    // mobile data api
    app.get("/mobile-data", async (req, res) => {
      const result = await mobileDataCollection.find({}).toArray();
      res.send(result);
    });

    // reviews api
    app.get("/reviews", async (req, res) => {
      const result = await reviewsCollection.find({}).toArray();
      res.send(result);
    });

    // users api
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const exitsUser = await usersCollection.findOne(query);
      if (exitsUser) {
        return res.send({ message: "user already exit" });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.get("/users", verifyJWT, async (req, res) => {
      const result = await usersCollection.find({}).toArray();
      res.send(result);
    });

    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await usersCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    app.get("/users/admin/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const decodedEmail = req.decoded.email;
      if (decodedEmail !== email) {
        return res
          .status(403)
          .send({ error: true, message: "forbidden access" });
      }
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const result = { admin: user?.role === "admin" };
      res.send(result);
    });

    // carts apis
    app.post("/carts", async (req, res) => {
      const newItem = req.body;
      const result = await cartsCollection.insertOne(newItem);
      res.send(result);
    });

    app.get("/carts/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        res.status(403).send({ error: true, message: "forbidden access" });
      }
      const query = { email: email };
      const result = await cartsCollection.find(query).toArray();
      res.send(result);
    });

    app.delete("/carts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartsCollection.deleteOne(query);
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
