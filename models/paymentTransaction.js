const mongoose = require("mongoose");
const Double = require("@mongoosejs/double");
const { Schema } = mongoose;

const paymentTransactionSchema = new Schema(
  {
    userID: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    TotalPrice: {
      type: Double,
      default: 0.0,
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },
    PaidAmount: {
      type: Double,
      default: 0.0,
    },
    TransactionHash: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const PaymentTransaction = mongoose.model(
  "PaymentTransaction",
  paymentTransactionSchema
);

module.exports = PaymentTransaction;
