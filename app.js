const mongoose = require('mongoose')
const express = require('express')
const app = express();
const dotenv = require('dotenv').config()
const projectRouter = require('./routes/projects')

mongoose.connect(process.env.mongo_uri)
.then(()=>{console.log('mongo connected.')})
.catch((error)=>{console.log('error occured '+error)});

app.use(express.json());

app.use('/',projectRouter)



const port = process.env.PORT || 7003;
app.listen(port,()=>{
    console.log(`running on port ${port}`)
});
