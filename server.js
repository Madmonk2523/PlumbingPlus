const path = require("path");
const express = require("express");
const nodemailer = require("nodemailer");

require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

const RECEIVER_EMAIL = "chasemallor@gmail.com";
const SENDER_EMAIL = "pipespluslongisland@gmail.com";

app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));
app.use(express.static(path.join(__dirname)));

function sanitize(value) {
  return String(value || "").replace(/[<>]/g, "").trim();
}

function validateLead(body) {
  const data = {
    name: sanitize(body.name),
    email: sanitize(body.email),
    phone: sanitize(body.phone),
    message: sanitize(body.message)
  };

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
  const phoneOk = /^[0-9+()\-\s]{7,}$/.test(data.phone);

  if (data.name.length < 2) return { error: "Invalid name", data };
  if (!emailOk) return { error: "Invalid email", data };
  if (!phoneOk) return { error: "Invalid phone", data };
  if (data.message.length < 8) return { error: "Invalid message", data };

  return { error: "", data };
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: SENDER_EMAIL,
    pass: process.env.EMAIL_APP_PASSWORD
  }
});

async function sendLeadEmail(data) {
  await transporter.sendMail({
    from: `Pipes Plus Website <${SENDER_EMAIL}>`,
    to: RECEIVER_EMAIL,
    replyTo: data.email,
    subject: "🚨 New Plumbing Lead",
    text: `Name: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone}\nMessage: ${data.message}`
  });
}

app.post("/api/lead", async (req, res) => {
  if (!process.env.EMAIL_APP_PASSWORD) {
    return res.status(500).json({ message: "Email is not configured" });
  }

  const { error, data } = validateLead(req.body || {});
  if (error) {
    return res.status(400).json({ message: error });
  }

  try {
    await sendLeadEmail(data);
    return res.status(200).json({ message: "Lead sent" });
  } catch (mailError) {
    return res.status(500).json({ message: "Unable to send lead" });
  }
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(port, () => {
  console.log(`Pipes Plus site running on port ${port}`);
});
