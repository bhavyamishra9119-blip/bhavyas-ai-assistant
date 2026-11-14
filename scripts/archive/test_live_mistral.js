async function testLiveMistral() {
  try {
    const res = await fetch("https://bhavyas-ai-assistant.vercel.app/api/mistral/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer 9gzelWoLUiASrmr37VHaVHDfuRYBUMPp"
      },
      body: JSON.stringify({
        model: "open-mistral-7b",
        messages: [{ role: "user", content: "hi" }],
        stream: true
      })
    });
    console.log("Status:", res.status);
    console.log("Headers:", Object.fromEntries(res.headers.entries()));
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let count = 0;
    while (!done) {
      const { value, done: d } = await reader.read();
      done = d;
      if (value) {
        count++;
        const chunk = decoder.decode(value);
        console.log(`Chunk ${count}:`, chunk);
        if (count > 5) break;
      }
    }
  } catch (err) {
    console.error("Error:", err);
  }
}
testLiveMistral();
