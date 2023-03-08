import mongoose from "mongoose";

export default function dbConnect() {
  mongoose.set("strictQuery", true);
  mongoose
    .connect(
      process.env.DB_URL
    )
    .then(() => console.log("DB Connected!"))
    .catch((err) => {
      console.log(err);
    });
}
