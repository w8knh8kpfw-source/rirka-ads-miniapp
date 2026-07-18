const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const TOKEN = process.env.BOT_TOKEN;
const ADMIN = process.env.ADMIN_ID;


// =========================
// НОВАЯ ЗАЯВКА
// =========================

app.post("/send", async (req, res) => {

    try {

        const data = req.body;

        console.log("NEW APPLICATION RECEIVED");


        const message = `
🆕 Новая заявка RIRKA Ads

👤 Пользователь:
${data.name || "Не указано"}

🏷 Username:
${data.username ? "@" + data.username : "Нет"}

🆔 Telegram ID:
${data.telegramId || "Нет"}

📌 Проект:
${data.project || "Не указано"}

📢 Описание:
${data.description || "Не указано"}

🔗 Ссылка:
${data.link || "Нет"}

📝 Текст поста:
${data.postText || "Нет"}

⏳ Срок:
${data.duration || "Не указан"}
`;


        const telegramResponse = await fetch(
            `https://api.telegram.org/bot${TOKEN}/sendMessage`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    chat_id: ADMIN,

                    text: message,

                    reply_markup: {

                        inline_keyboard: [

                            [

                                {
                                    text: "🟢 Одобрить",
                                    callback_data:
                                        `approve_${data.telegramId}`
                                },

                                {
                                    text: "🟡 Поправить",
                                    callback_data:
                                        `edit_${data.telegramId}`
                                }

                            ],

                            [

                                {
                                    text: "🔴 Отклонить",
                                    callback_data:
                                        `reject_${data.telegramId}`
                                }

                            ]

                        ]

                    }

                })

            }

        );


        const telegramResult =
            await telegramResponse.json();


        console.log(
            "TELEGRAM RESPONSE:",
            telegramResult
        );


        res.json({

            success: true

        });


    } catch (error) {

        console.log(
            "SERVER ERROR:",
            error
        );


        res.status(500).json({

            success: false

        });

    }

});


// =========================
// TELEGRAM WEBHOOK
// =========================

app.post("/telegram", async (req, res) => {

    try {

        const query =
            req.body.callback_query;


        if (!query) {

            return res.sendStatus(200);

        }


        const [action, userId] =
            query.data.split("_");


        let text = "";


        if (action === "approve") {

            text =
                "✅ Ваша заявка одобрена RIRKA Ads!\n\n"
                +
                "Скоро появится возможность оплатить размещение ⭐️";

        }


        if (action === "edit") {

            text =
                "✏️ Пожалуйста, исправьте заявку "
                +
                "и отправьте её снова.";

        }


        if (action === "reject") {

            text =
                "❌ Ваша заявка отклонена RIRKA Ads.";

        }


        await fetch(

            `https://api.telegram.org/bot${TOKEN}/sendMessage`,

            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body: JSON.stringify({

                    chat_id: userId,

                    text: text

                })

            }

        );


        await fetch(

            `https://api.telegram.org/bot${TOKEN}/answerCallbackQuery`,

            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body: JSON.stringify({

                    callback_query_id:
                        query.id

                })

            }

        );


        res.sendStatus(200);


    } catch (error) {

        console.log(

            "WEBHOOK ERROR:",

            error

        );


        res.sendStatus(500);

    }

});


// =========================
// TEST
// =========================

app.get("/test", (req, res) => {

    res.send(
        "RIRKA ADS SERVER WORKING"
    );

});


// =========================
// START SERVER
// =========================

const PORT =
    process.env.PORT || 3000;


app.listen(PORT, () => {

    console.log(

        `RIRKA ADS SERVER STARTED ON PORT ${PORT}`

    );

});
