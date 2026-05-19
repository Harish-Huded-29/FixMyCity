const mongoose = require('mongoose');
const municipalCommentSchema = new mongoose.Schema({
  issue:    { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true },
  author:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:     { type: String, required: true, maxlength: 1000 },
  likes:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  likeCount:{ type: Number, default: 0 },
  isDeleted:{ type: Boolean, default: false },
}, { timestamps: true });
municipalCommentSchema.index({ issue: 1, createdAt: 1 });
module.exports = mongoose.model('MunicipalComment', municipalCommentSchema);
