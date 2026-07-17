const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const { createClient } = require("@supabase/supabase-js");

const app = express();

app.use(cors());
app.use(express.json());


const TOKEN = process.env.BOT_TOKEN;
const ADMIN = process.env.ADMIN_ID;
const supabase = createClient(
process.env.SUPABASE_URL,
process.env.SUPABASE_KEY
);

app.post("/send", async (req,res)=>{


const data = req.body;


const message = `
🆕 Новая заявка RIRKA Ads

👤 Пользователь:
${data.name || "Не указано"}

🏷 Username:
${data.username ? "@" + data.username : "Нет"}

🆔 Telegram ID:
${data.telegramId || "Нет"}

📌 Проект:
${data.project}

📢 Описание:
${data.description}

🔗 Ссылка:
${data.link}

📝 Текст поста:
${data.postText}

⏳ Срок:
${data.duration}
`;



await fetch(
`https://api.telegram.org/bot${TOKEN}/sendMessage`,
{
method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

chat_id:ADMIN,

text:message,

reply_markup:{
inline_keyboard:[
[
{
text:"🟢 Одобрить",
callback_data:"approve"
},
{
text:"🟡 Поправить",
callback_data:"edit"
}
],
[
{
text:"🔴 Отклонить",
callback_data:"reject"
}
]
]
}

})

});


res.json({
success:true
});


});


app.listen(3000,()=>{
app.post("/telegram", async (req,res)=>{

const query = req.body.callback_query;

if(!query){
return res.sendStatus(200);
}

const userId = query.message.text.match(/Telegram ID:\n(\d+)/)?.[1];

let text = "";

if(query.data === "approve"){
text = "✅ Ваша заявка одобрена RIRKA Ads";
}

if(query.data === "edit"){
text = "✏️ Пожалуйста, исправьте заявку и отправьте её снова";
}

if(query.data === "reject"){
text = "❌ Ваша заявка отклонена RIRKA Ads";
}


await fetch(
`https://api.telegram.org/bot${TOKEN}/sendMessage`,
{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
chat_id:userId,
text:text
})
});


res.sendStatus(200);

});
console.log("Server started");

});
