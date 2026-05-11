const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");

const uri = process.env.MONGO_DB_URI;
const app = express();
const PORT = process.env.PORT;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const database = client.db("wanderlast");
    const destinationsCollection = database.collection("destinations");

    // Create a new destination
    app.post("/destinations", async (req, res) => {
      const destination = req.body;
      const result = await destinationsCollection.insertOne(destination);
      res.json({
        success: true,
        message: "Destination added successfully",
        id: result.insertedId,
      });
    });

    // Get all destinations
    app.get("/destinations", async (req, res) => {
      const destinations = await destinationsCollection.find().toArray();
      res.json(destinations);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is running!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
