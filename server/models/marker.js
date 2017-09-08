const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const markerSchema = new Schema({
    owner: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    label: { type: String },
    draggable: { type: Boolean },
    visible: { type: Boolean }
});

module.exports = mongoose.model("Marker", markerSchema);
