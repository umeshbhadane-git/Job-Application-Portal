import mongoose from "mongoose";

let connectionPromise;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI environment variable is missing");
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
      })
      .catch((error) => {
        connectionPromise = undefined;
        throw error;
      });
  }

  const conn = await connectionPromise;

  console.log(`MongoDB Connected: ${conn.connection.host}`);

  return conn.connection;
};

export default connectDB;


// above to connect via versal 

// import mongoose from "mongoose";

// const connectDB = async () => {
//     if (mongoose.connection.readyState === 1) {
//         return mongoose.connection;
//     }

//     const uri = process.env.MONGO_URI;

//     if (!uri) {
//         throw new Error("MONGO_URI environment variable is missing");
//     }

//     const conn = await mongoose.connect(uri);

//     console.log(`MongoDB Connected: ${conn.connection.host}`);

//     return conn.connection;
// };

// export default connectDB;