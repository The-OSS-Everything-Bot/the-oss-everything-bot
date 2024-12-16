import mongoose from "mongoose";

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  id: String,
  warns: {
    type: [],

    reason: {
      type: String,
      required: true,
    },
    by: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      required: true,
    },

    required: true,
  },
});

export default mongoose.model("User", UserSchema);
