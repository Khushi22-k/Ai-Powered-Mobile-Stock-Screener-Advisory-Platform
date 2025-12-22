export async function chatGPTQuery(message) {
  const res = await fetch("http://localhost:5000/auth/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message
    })
  });


  return await res.json();
}
