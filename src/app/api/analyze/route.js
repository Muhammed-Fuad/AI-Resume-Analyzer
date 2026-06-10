export async function POST(request) {
  try {
    const body = await request.json();

    const response = await fetch(
      "https://tonystark009.app.n8n.cloud/webhook/ai-resume-analyzer",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    const data = await response.text();

    return new Response(data, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}