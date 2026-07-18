const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const TOKEN = process.env.BOT_TOKEN;
const ADMIN = String(process.env.ADMIN_ID);

const pendingPrices = new Map();


// =========================
// TELEGRAM API
// =========================

async function telegram(method, data) {
    const response = await fetch(
        `https://api.telegram.org/bot${TOKEN}/${method}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        }
    );

    return await response.json();
}


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


        await telegram("sendMessage", {

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

        });


        res.json({
            success: true
        });


    } catch (error) {

        console.log("SERVER ERROR:", error);

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

        const update = req.body;


        // ========================================
        // УСПЕШНАЯ ОПЛАТА
        // ========================================

        if (
            update.message &&
            update.message.successful_payment
        ) {

            const message =
                update.message;

            const payment =
                message.successful_payment;

            const payload =
                payment.invoice_payload;

            const parts =
                payload.split(":");

            const userId =
                parts[1];


            console.log(
                "SUCCESSFUL PAYMENT:",
                payment
            );


            await telegram("sendMessage", {

                chat_id: ADMIN,

                text:
                    `💰 ОПЛАТА ПОЛУЧЕНА!\n\n`
                    +
                    `⭐️ Сумма: `
                    +
                    `${payment.total_amount}\n`
                    +
                    `🆔 Пользователь: `
                    +
                    `${userId}\n`
                    +
                    `💳 Платёж:\n`
                    +
                    `${payment.telegram_payment_charge_id}`

            });


            await telegram("sendMessage", {

                chat_id: userId,

                text:
                    "✅ Оплата получена!\n\n"
                    +
                    "Ваша рекламная заявка принята в работу ⭐️"

            });


            return res.sendStatus(200);

        }


        // ========================================
        // PRE-CHECKOUT
        // ========================================

        if (update.pre_checkout_query) {

            const query =
                update.pre_checkout_query;


            await telegram(
                "answerPreCheckoutQuery",
                {

                    pre_checkout_query_id:
                        query.id,

                    ok: true

                }
            );


            return res.sendStatus(200);

        }


        // ========================================
        // СООБЩЕНИЕ ОТ АДМИНА
        // ========================================

        if (
            update.message &&
            update.message.from &&
            update.message.text
        ) {

            const message =
                update.message;


            const adminId =
                String(message.from.id);


            if (
                adminId === ADMIN
            ) {

                const userId =
                    pendingPrices.get(ADMIN);


                if (userId) {

                    const amount =
                        parseInt(
                            message.text
                        );


                    if (
                        isNaN(amount) ||
                        amount < 1
                    ) {

                        await telegram(
                            "sendMessage",
                            {

                                chat_id: ADMIN,

                                text:
                                    "❌ Введите сумму целым числом ⭐️\n\n"
                                    +
                                    "Например: 50"

                            }
                        );


                        return res.sendStatus(200);

                    }


                    pendingPrices.delete(
                        ADMIN
                    );


                    const payload =
                        `ad:${userId}:${amount}`;


                    await telegram(
                        "sendInvoice",
                        {

                            chat_id: userId,

                            title:
                                "Размещение рекламы RIRKA Ads",

                            description:
                                "Оплата рекламного размещения.",

                            payload:
                                payload,

                            currency:
                                "XTR",

                            prices: [

                                {

                                    label:
                                        "Рекламное размещение",

                                    amount:
                                        amount

                                }

                            ],

                            start_parameter:
                                `rirka_ads_${Date.now()}`

                        }
                    );


                    await telegram(
                        "sendMessage",
                        {

                            chat_id: ADMIN,

                            text:
                                `✅ Инвойс на ${amount} ⭐️ отправлен рекламодателю.`

                        }
                    );


                    return res.sendStatus(200);

                }

            }

        }


        // ========================================
        // CALLBACK-КНОПКИ
        // ========================================

        if (
            !update.callback_query
        ) {

            return res.sendStatus(200);

        }


        const query =
            update.callback_query;


        const callbackData =
            query.data;


        const parts =
            callbackData.split("_");


        const action =
            parts[0];

        const userId =
            parts[1];


        // ========================================
        // ОДОБРИТЬ
        // ========================================

        if (
            action === "approve"
        ) {


            pendingPrices.set(
                ADMIN,
                userId
            );


            await telegram(
                "sendMessage",
                {

                    chat_id: ADMIN,

                    text:
                        "💰 Введи стоимость размещения в ⭐️\n\n"
                        +
                        "Например:\n"
                        +
                        "50"

                }
            );


            await telegram(
                "answerCallbackQuery",
                {

                    callback_query_id:
                        query.id,

                    text:
                        "Ожидаю стоимость ⭐️"

                }
            );


            return res.sendStatus(200);

        }


        // ========================================
        // ПОПРАВИТЬ
        // ========================================

        if (
            action === "edit"
        ) {


            await telegram(
                "sendMessage",
                {

                    chat_id: userId,

                    text:
                        "✏️ Пожалуйста, исправьте заявку "
                        +
                        "и отправьте её снова."

                }
            );


            await telegram(
                "answerCallbackQuery",
                {

                    callback_query_id:
                        query.id

                }
            );


            return res.sendStatus(200);

        }


        // ========================================
        // ОТКЛОНИТЬ
        // ========================================

        if (
            action === "reject"
        ) {


            await telegram(
                "sendMessage",
                {

                    chat_id: userId,

                    text:
                        "❌ Ваша заявка отклонена RIRKA Ads."

                }
            );


            await telegram(
                "answerCallbackQuery",
                {

                    callback_query_id:
                        query.id

                }
            );


            return res.sendStatus(200);

        }


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
// START
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
