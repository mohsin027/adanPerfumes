import mongoose from "mongoose";

export default function dbConnect() {
  mongoose.set("strictQuery", true);
  mongoose
    .connect(
      "mongodb+srv://essesnceperfume:essence123@cluster0.ez7a7pv.mongodb.net/?retryWrites=true&w=majority"
    )
    .then(() => console.log("Connected!"))
    .catch((err) => {
      console.log(err);
    });
}
