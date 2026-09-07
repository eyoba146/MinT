require("dotenv").config();

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.models) {
    console.log(data.models.map((m) => m.name));
  } else {
    console.log(data);
  }
}

listModels().catch(console.error);
