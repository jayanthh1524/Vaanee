import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

const genAI = new GoogleGenerativeAI(apiKey);

export async function askVaaneeAI(prompt: string) {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
    });

    const result = await model.generateContent(prompt);

    return result.response.text();
  } catch (error) {
    console.error(error);
    return 'Vaanee AI failed to respond.';
  }
}