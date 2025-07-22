// ШАГ А: Начинаем с импорта всех трех библиотек
import { OpenAI } from 'openai';
import nodemailer from 'nodemailer';
import fetch from 'node-fetch';

export default function handler(req, res) {
  console.log("Import test handler invoked successfully. All modules loaded.");
  res.status(200).json({ status: 'ok', message: 'Modules were imported without crashing the function.' });
}
