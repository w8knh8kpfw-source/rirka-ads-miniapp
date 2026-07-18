const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const { createClient } = require("@supabase/supabase-js");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const TOKEN = process.env.BOT_TOKEN;
const ADMIN = process.env.ADMIN_ID;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// =========================
// СОЗДАНИЕ ЗАЯВКИ
// =========================

app.post("/send", async (req, res) => {

    try {

        const data = req.body;

        console.log("NEW APPLICATION RECEIVED");

        const { data: application, error } = await supabase
            .from("applications")
            .insert({
                telegram_id: data.telegramId,
                username: data.username,
                name: data.name,

                project: data.project,
                description: data.description,
                link: data.link,
                post_text: data.postText,
                duration: data.duration,

                status: "pending"
            })
            .select()
            .single();


        if (error) {

            console.log("SUPABASE ERROR:", error);

            return res.status(500).json({
                success: false,
                error: error.message
            });

        }


        console.log(
            "APPLICATION CREATED:",
            application.id
        );


        const message = `
🆕 Новая заявка RIRKA Ads

🆔 Заявка №${application.id}

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
${data.link || "Нет"}

📝 Текст поста:
${data.postText || "Нет"}

⏳ Срок:
${data.duration}
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
                                        `approve_${application.id}`
                                },

                                {
                                    text: "🟡 Поправить",

                                    callback_data:
                                        `edit_${application.id}`
                                }

                            ],

                            [

                                {
                                    text: "🔴 Отклонить",

                                    callback_data:
                                        `reject_${application.id}`
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
            "TELEGRAM RESULT:",
            telegramResult
        );


        res.json({

            success: true,

            applicationId:
                application.id

        });


    } catch (error) {

        console.log(
            "SERVER ERROR:",
            error
        );

        res.status(500).json({

            success: false,

            error: error.message

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


        const callbackData =
            query.data;


        const parts =
            callbackData.split("_");


        const action =
            parts[0];


        const applicationId =
            parts[1];


        const {
            data: application,
            error
        } = await supabase

            .from("applications")

            .select("*")

            .eq("id", applicationId)

            .single();


        if (error || !application) {

            console.log(
                "APPLICATION NOT FOUND:",
                applicationId
            );

            return res.sendStatus(200);

        }


        let status;

        let text;


        if (action === "approve") {

            status =
                "approved";


            text =
                "✅ Ваша заявка одобрена RIRKA Ads!\n\n" +

                "Скоро появится возможность " +

                "оплатить размещение ⭐";

        }


        if (action === "edit") {

            status =
                "edit";


            text =
                "✏️ Пожалуйста, исправьте заявку " +

                "и отправьте её снова.";

        }


        if (action === "reject") {

            status =
                "rejected";


            text =
                "❌ Ваша заявка отклонена RIRKA Ads.";

        }


        await supabase

            .from("applications")

            .update({

                status:
                    status

            })

            .eq(
                "id",
                applicationId
            );


        await fetch(

            `https://api.telegram.org/bot${TOKEN}/sendMessage`,

            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body: JSON.stringify({

                    chat_id:
                        application.telegram_id,

                    text:
                        text

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
// ПРОВЕРКА СЕРВЕРА
// =========================

app.get("/test", (req, res) => {

    res.send(
        "RIRKA ADS SERVER WORKING"
    );

});


// =========================
// ЗАПУСК СЕРВЕРА
// =========================

const PORT =
    process.env.PORT || 3000;


app.listen(
    PORT,

    () => {

        console.log(
            `RIRKA ADS SERVER STARTED ON PORT ${PORT}`
        );

    }

);
