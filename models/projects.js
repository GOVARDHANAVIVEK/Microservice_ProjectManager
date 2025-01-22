const mongoose = require('mongoose');
const taskSchema = new mongoose.Schema({
    ProjectId:{type:String,required:false},
    Name: { type: String, required: true },
    Description: { type: String },
    StartDate: { type: Date, default: Date.now },
    EndDate: { type: Date },
    Tasks: [{ type: String,default:[] }]
});

const Projects = mongoose.model('Projects',taskSchema);
module.exports= Projects;