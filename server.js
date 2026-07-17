const express = require("express");

const app = express();

app.use(express.json());


app.post("/send", (req,res)=>{

console.log(req.body);

res.json({
success:true
});

});


app.listen(3000,()=>{

console.log("Server started");

});
