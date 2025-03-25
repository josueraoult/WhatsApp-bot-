const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

// ✅ Variables directement dans le code
const VERIFY_TOKEN = "whatsApp";
const WHATSAPP_TOKEN = "EAGWp4PDBMf4BOZBZCZAbiTgO8xCd8uFoYYNF9RvbNKWu7GIm6bHi5xHabIuPInulJOGP1d1M77nfuwPZAiCbJH4WhnYMIL7TLV0kgwfGZCP350oI4bjuGGBYIftmTArOUilSkvTIPHKrJSNObKoV7n8GrhOvs0MoeAvxarucvlJXTlkFwqRmSBZAmaeiZBSxMeyFdcZD";
const API_AI_URL = "https://jonell01-ccprojectsapihshs.hf.space/api/gpt4";

app.use(bodyParser.json());

// 🔹 Vérification du Webhook pour Meta
app.get("/webhook", (req, res) => {
    let mode = req.query["hub.mode"];
    let token = req.query["hub.verify_token"];
    let challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
        console.log("🔗 Webhook vérifié !");
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

// 🔹 Traitement des messages WhatsApp
app.post("/webhook", async (req, res) => {
    let body = req.body;

    if (body.object === "whatsapp_business_account") {
        let message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

        if (message && message.type === "text") {
            let from = message.from;
            let userText = message.text.body;

            console.log(`📩 Message reçu de ${from}: ${userText}`);

            // 🔹 Appel API IA
            try {
                let response = await axios.get(`${API_AI_URL}?ask=${encodeURIComponent(userText)}&id=1`);
                let aiResponse = response.data?.response || "Je n'ai pas compris.";

                // 🔹 Envoi de la réponse sur WhatsApp
                await sendMessage(from, aiResponse);
            } catch (error) {
                console.error("❌ Erreur API AI:", error.message);
            }
        }
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
});

// 🔹 Fonction pour envoyer un message WhatsApp
async function sendMessage(to, text) {
    try {
        await axios.post(`https://graph.facebook.com/v18.0/me/messages`, {
            messaging_product: "whatsapp",
            to: to,
            text: { body: text },
        }, {
            headers: {
                Authorization: `Bearer ${WHATSAPP_TOKEN}`,
                "Content-Type": "application/json",
            }
        });

        console.log(`✅ Message envoyé à ${to}: ${text}`);
    } catch (error) {
        console.error("❌ Erreur envoi WhatsApp:", error.response?.data || error.message);
    }
}

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur en ligne sur http://localhost:${PORT}`);
});
