const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    // Gọi trực tiếp fetch tới API của Google
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    
    console.log("--- DANH SÁCH MODEL KHẢ DỤNG ---");
    data.models.forEach(model => {
      console.log(`Model ID: ${model.name.replace('models/', '')}`);
      console.log(`Hỗ trợ generateContent: ${model.supportedGenerationMethods.includes('generateContent')}`);
      console.log('------------------------------');
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách model:", error);
  }
}

listModels();