// Simple test function to verify Netlify Functions work
exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'Netlify Functions are working!',
      timestamp: new Date().toISOString(),
      event_path: event.path,
      method: event.httpMethod
    })
  };
};
