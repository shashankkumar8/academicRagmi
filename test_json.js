const jsonString = '{"type": "error", "message": "OpenAI streaming error: OpenAI error 429: {\\n    \\"error\\": {\\n        \\"message\\": \\"You have no credits remaining. Add credits to continue using the API at https://platform.openai.com/settings/organization/billing/.\\",\\n        \\"type\\": \\"insufficient_quota\\",\\n        \\"param\\": null,\\n        \\"code\\": \\"credit_balance_exhausted\\"\\n    }\\n}\\n"}';

try {
  const obj = JSON.parse(jsonString);
  console.log("Success:", obj);
} catch(e) {
  console.error("Parse Error:", e.message);
}
