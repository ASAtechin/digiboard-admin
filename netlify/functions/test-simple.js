// Simple test function
exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'Simple test function working!',
      timestamp: new Date().toISOString(),
      path: event.path
    })
  };
};
