export default function handler(req, res) {
  console.log(`[${new Date().toISOString()}] Test function invoked successfully.`);
  res.status(200).json({ status: 'ok', message: 'Hello from the API!' });
}
