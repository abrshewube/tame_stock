import mongoose from 'mongoose';
import Product from './models/Product.js';

// Function to connect to the database and insert products
const addProducts = async () => {
  try {
    // Replace with your actual MongoDB URI
    const MONGODB_URI = 'mongodb+srv://4ourmella:i91uJFSeNZOZEHzl@cluster0.57ikgka.mongodb.net/tamestock?retryWrites=true&w=majority&appName=Cluster0'; 

    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const productsToAdd = [
      { name: '24D (Chemical)', location: 'Adama', price: 0 },
      { name: 'Agrostar ethio (Chemical)', location: 'Adama', price: 0 },
      { name: 'Ammon 2nd (Burse and AG) 300g', location: 'Adama', price: 0 },
      { name: 'Beetroot (Bursa) 250gram', location: 'Adama', price: 0 },
      { name: 'Beetroot (Detai) 250gram', location: 'Adama', price: 0 },
      { name: 'Beetroot (France) 250gram', location: 'Adama', price: 0 },
      { name: 'Beetroot (Golden) Safty 250gram', location: 'Adama', price: 0 },
      { name: 'Beetroot (Greenseed) 1kg', location: 'Adama', price: 0 },
      { name: 'Beetroot (Greenseed) 250gram', location: 'Adama', price: 0 },
      { name: 'Beetroot (Monarchy) 250gram', location: 'Adama', price: 0 },
      { name: 'Beetroot (Southatric) 100gram', location: 'Adama', price: 0 },
      { name: 'Beetroot (Topharvest) 250gram', location: 'Adama', price: 0 },
      { name: 'Beetroot Z (Topharvest oriz) 250gram', location: 'Adama', price: 0 },
      { name: 'Bolano', location: 'Adama', price: 0 },
      { name: 'Cabbage (Dargal) (Durgal) 250gram', location: 'Adama', price: 0 },
      { name: 'Cabbage (France) 250gram', location: 'Adama', price: 0 },
      { name: 'Cabbage (Proseed) 250gram', location: 'Adama', price: 0 },
      { name: 'Cabbage (Southatric) 250gram', location: 'Adama', price: 0 },
      { name: 'Cabbage (Soutnatric) 500gram', location: 'Adama', price: 0 },
      { name: 'Carrot (AG) (Bursa) 250gram', location: 'Adama', price: 0 },
      { name: 'Carrot (Durga) 250gram', location: 'Adama', price: 0 },
      { name: 'Carrot (Golden) 250gram', location: 'Adama', price: 0 },
      { name: 'Carrot (Royal) harvest) 250gram', location: 'Adama', price: 0 },
      { name: 'Carrot (Soutnatric) 250gram', location: 'Adama', price: 0 },
      { name: 'Cucumber (Ethrutic) 500gram', location: 'Adama', price: 0 },
      { name: 'Cucumber (Greenseed) 1500gram', location: 'Adama', price: 0 },
      { name: 'Eggplante (Greenseed) 50gram', location: 'Adama', price: 0 },
      { name: 'Gaijan (Chemical)', location: 'Adama', price: 0 },
      { name: 'Gisbe (Chemical)', location: 'Adama', price: 0 },
      { name: 'Goldbud (Chemical)', location: 'Adama', price: 0 },
      { name: 'Guard (Chemical)', location: 'Adama', price: 0 },
      { name: 'Hwete (AG) 50gram', location: 'Adama', price: 0 },
      { name: 'Hotpaper (AG)', location: 'Adama', price: 0 },
      { name: 'Hotpaper (kilo)', location: 'Adama', price: 0 },
      { name: 'Hotpaper (Soutnatric) 1kg', location: 'Adama', price: 0 },
      { name: 'Hotpaper (Soutnatric) (AG) 50gram', location: 'Adama', price: 0 },
      { name: 'Hulzeb (Chemical)', location: 'Adama', price: 0 },
      { name: 'Hunter (AG) 500gram', location: 'Adama', price: 0 },
      { name: 'Lettuce (Soutnatric) 50gram', location: 'Adama', price: 0 },
      { name: 'Lettuce (Soutnatric) AG 500gram', location: 'Adama', price: 0 },
      { name: 'Metalaxil (Soutnatric) (Chemical)', location: 'Adama', price: 0 },
      { name: 'Onion (AG) 50gram', location: 'Adama', price: 0 },
      { name: 'Onion (Baifamin) Paper) 500gram', location: 'Adama', price: 0 },
      { name: 'Onion (Durga)550 Gram', location: 'Adama', price: 0 },
      { name: 'Onion (Durga) 250gram', location: 'Adama', price: 0 },
      { name: 'Onion (Durga) 500gram', location: 'Adama', price: 0 },
      { name: 'Onion (METHABAR) 100.000SEEE D', location: 'Adama', price: 0 },
      { name: 'Onion (Perfect) 250gram', location: 'Adama', price: 0 },
      { name: 'Onion (Proseed) South Africa', location: 'Adama', price: 0 },
      { name: 'Onion (Zorol Bumbly) 2500g', location: 'Adama', price: 0 },
      { name: 'Onion (Zorol Creaol) 250gram', location: 'Adama', price: 0 },
      { name: 'Onion Baft amin Yemen) 500gram', location: 'Adama', price: 0 },
      { name: 'OXY (Chemical)', location: 'Adama', price: 0 },
      { name: 'Perfer (Chemical)', location: 'Adama', price: 0 },
      { name: 'POGPSUP (Chemical)', location: 'Adama', price: 0 },
      { name: 'Rader (Chemical)', location: 'Adama', price: 0 },
      { name: 'Sprach (Ethutic) 2500gram', location: 'Adama', price: 0 },
      { name: 'Spray (2L) 2L', location: 'Adama', price: 0 },
      { name: 'Spray D2L and 16L)', location: 'Adama', price: 0 },
      { name: 'Switchbard (AG) 250gram', location: 'Adama', price: 0 },
      { name: 'Switchbard (Soutnatric) AG) 500gram', location: 'Adama', price: 0 },
      { name: 'Teminator (Chemical)', location: 'Adama', price: 0 },
      { name: 'Tomato (AG) 500gram', location: 'Adama', price: 0 },
      { name: 'Tomato (Bursa) and Roma', location: 'Adama', price: 0 },
      { name: 'Tomato (Marafone and Roma V) 250g', location: 'Adama', price: 0 },
      { name: 'Tutan (Chemical) 4-F', location: 'Adama', price: 0 },
      { name: 'Watermelon (Bursa) tunx2500x', location: 'Adama', price: 0 },
      { name: 'Watermelon (Ethrutic) 2500gram', location: 'Adama', price: 0 },
      { name: 'Watermelon (Zorol) (Durga) 2500gram', location: 'Adama', price: 0 },
      { name: 'Watermelon (Durga) 2500g', location: 'Adama', price: 0 },
      { name: 'Watermelon (Proseed) 2500gram', location: 'Adama', price: 0 },
      { name: 'Watermelon (Rimes) 2500gram', location: 'Adama', price: 0 },
      { name: 'Watermelon (Soutnatric) a) 100gram', location: 'Adama', price: 0 },
      { name: 'Watermelon (Soutnatric) (Gophomero) 100gram', location: 'Adama', price: 0 },
      { name: 'Winteler (Chemical)', location: 'Adama', price: 0 },
      { name: 'Zamos 1KG', location: 'Adama', price: 0 },
      { name: 'Zamos (Chemical) 500Gram', location: 'Adama', price: 0 },
    ];

    // Insert all products into the collection
    const result = await Product.insertMany(productsToAdd);
    console.log(`Successfully inserted ${result.length} products`);
    
    // Close the database connection
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error adding products:', error);
  }
};

addProducts();