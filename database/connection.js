import mongoose from "mongoose";

const dbconnection = async () => {
  try {
    const db = await mongoose.connect(process.env.MONGO_URI, { dbName: "Portfolio" });
    console.log(`Connected to database host: ${db.connection.host}`);
  }
  catch (e) {
    console.log(`Error connecting db: ${e.message}`);
  }
}

export default dbconnection;