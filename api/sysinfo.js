export const config = {
  runtime: 'edge'
};

export default async function handler(req) {
  return new Response(JSON.stringify({
    status: 'ok',
    mode: 'Cloud AI Active',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
