// updateLocations.js
import mongoose from "mongoose";

const uri = "mongodb+srv://4ourmella:i91uJFSeNZOZEHzl@cluster0.57ikgka.mongodb.net/tamestock?retryWrites=true&w=majority&appName=Cluster0";

// Define schema (minimal, only needed fields)
const productSchema = new mongoose.Schema(
  {
    name: String,
    location: String,
    initialBalance: Number,
    price: Number,
  },
  { collection: "products" }
);

const Product = mongoose.model("Product", productSchema);

async function updateLocations() {
  try {
    await mongoose.connect(uri);

    const result = await Product.updateMany(
      { location: "Addis Ababa" }, // filter
      { $set: { location: "AddisAbaba" } } // update
    );

    console.log(`Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error updating locations:", err);
  }
}

updateLocations();
