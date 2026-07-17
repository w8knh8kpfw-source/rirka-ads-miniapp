const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();

app.use(cors());
app.use(express.json());


const TOKEN = process.env.BOT_TOKEN;
const ADMIN = process.env.ADMIN_ID;


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

console.log("Server started");

});
