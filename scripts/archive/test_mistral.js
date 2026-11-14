async function testMistral() {
  const key = "9gzelWoLUiASrmr37VHaVHDfuRYBUMPp";
  try {
    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`
      },
      body: JSON.stringify({
        model: "open-mistral-7b",
        messages: [{ role: "user", content: "hi" }]
      })
    });
    const text = await res.text();
    console.log(`Mistral status: ${res.status} | Body: ${text}`);
  } catch (err) {
    console.log(`Error: ${err.message}`);
  }
}

testMistral();
