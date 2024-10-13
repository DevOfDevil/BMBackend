const mongoose = require("mongoose");
const Double = require("@mongoosejs/double");
const { Schema } = mongoose;

const CategoryPurchasedSchema = new Schema(
  {
    userID: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    CatID: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    CatPrice: {
      type: Double,
      default: 0.0,
    },
    IsDeleted: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  { timestamps: true }
);

const CategoryPurchased = mongoose.model(
  "CategoryPurchased",
  CategoryPurchasedSchema
);

module.exports = CategoryPurchased;
