// // updateLocations.js
// import mongoose from "mongoose";

// const uri = "mongodb+srv://4ourmella:i91uJFSeNZOZEHzl@cluster0.57ikgka.mongodb.net/tamestock?retryWrites=true&w=majority&appName=Cluster0";

// // Define schema (minimal, only needed fields)
// const productSchema = new mongoose.Schema(
//   {
//     name: String,
//     location: String,
//     initialBalance: Number,
//     price: Number,
//   },
//   { collection: "products" }
// );

// const Product = mongoose.model("Product", productSchema);

// async function updateLocations() {
//   try {
//     await mongoose.connect(uri);

//     const result = await Product.updateMany(
//       { location: "Addis Ababa" }, // filter
//       { $set: { location: "AddisAbaba" } } // update
//     );

//     console.log(`Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);

//     await mongoose.disconnect();
//   } catch (err) {
//     console.error("Error updating locations:", err);
//   }
// }

// updateLocations();

// fetchProductNames.js
import mongoose from "mongoose";

const uri = "mongodb+srv://4ourmella:i91uJFSeNZOZEHzl@cluster0.57ikgka.mongodb.net/tamestock?retryWrites=true&w=majority&appName=Cluster0";

// Define schema (minimal)
const productSchema = new mongoose.Schema(
  { name: String },
  { collection: "products" }
);

const Product = mongoose.model("Product", productSchema);

async function fetchProductNames() {
  try {
    await mongoose.connect(uri);

    const products = await Product.find({}, { name: 1, _id: 0 }); // fetch only "name"

    console.log("Product Names:");
    products.forEach((p) => console.log(p.name));

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error fetching product names:", err);
  }
}

fetchProductNames();
