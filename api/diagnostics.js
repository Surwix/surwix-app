import { OpenAI } from 'openai';
import fetch from 'node-fetch';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    console.log('--- Starting Full Diagnostics ---');
    const results = {};

    // 1. Test basic internet connectivity
    try {
        console.log('[1/4] Testing basic internet (fetch to google.com)...');
        const internetTest = await fetch('https://www.google.com', { method: 'HEAD', timeout: 5000 });
        results.internet_test = { success: internetTest.ok, status: internetTest.status };
        console.log('✅ Internet test successful.');
    } catch (e) {
        console.error('❌ Internet test failed:', e.message);
        results.internet_test = { success: false, error: e.message };
    }

    // 2. Test OpenAI connection
    try {
        console.log('[2/4] Testing OpenAI API connection...');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        await openai.models.list(); // A simple, lightweight request
        results.openai_test = { success: true };
        console.log('✅ OpenAI test successful.');
    } catch (e) {
        console.error('❌ OpenAI test failed:', e.message);
        results.openai_test = { success: false, error: e.message };
    }
    
    // 3. Test PDFMonkey connection
    try {
        console.log('[3/4] Testing PDFMonkey API connection...');
        const pdfMonkeyTest = await fetch('https://api.pdfmonkey.com/api/v1/ping', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${process.env.PDFMONKEY_API_KEY}` },
            timeout: 5000
        });
        results.pdfmonkey_test = { success: pdfMonkeyTest.ok, status: pdfMonkeyTest.status };
        console.log('✅ PDFMonkey test successful.');
    } catch (e) {
        console.error('❌ PDFMonkey test failed:', e.message);
        results.pdfmonkey_test = { success: false, error: e.message };
    }

    // 4. Test Nodemailer (Gmail) connection
    try {
        console.log('[4/4] Testing Nodemailer SMTP connection...');
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_SERVER_USER,
                pass: process.env.EMAIL_SERVER_PASSWORD,
            },
        });
        await transporter.verify(); // This tests the connection without sending an email
        results.email_test = { success: true };
        console.log('✅ Nodemailer test successful.');
    } catch (e) {
        console.error('❌ Nodemailer test failed:', e);
        results.email_test = { success: false, error: e.message };
    }

    console.log('--- Diagnostics Complete ---');
    res.status(200).json(results);
}
