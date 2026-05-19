import { getToken, setCors } from '../_lib.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const tk = await getToken();
  res.json({
    connected: !!tk,
    baseUrl:   process.env.ARUBA_BASE_URL || 'https://apigw-uswest4.central.arubanetworks.com',
    user:      process.env.ARUBA_USER     || '',
  });
}
