


const mongoose = require("mongoose");

async function connectToDB() {
    try {
        // Bina kisi process.env ke direct connection format aur badha hua timeout
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 60000,
            socketTimeoutMS: 60000
        });
        console.log("Connected to database successfully!");
    } catch (error) {
        console.error("Error connecting to database:", error.message);
    }
}

module.exports = connectToDB;