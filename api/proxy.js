export default async function handler(req, res) {
  const target = req.query.url;

  if (!target || !target.startsWith("http")) {
    res.status(400).send("Invalid URL");
    return;
  }

  try {
    const upstream = await fetch(target, {
      method: "GET",
      headers: {
        "User-Agent": "okhttp/4.10.0",
        "Accept": "*/*",
        "Connection": "keep-alive"
      }
    });

    if (!upstream.ok) {
      res.status(502).send("Upstream error");
      return;
    }

    // Content-Type forward
    const contentType = upstream.headers.get("content-type");
    if (contentType) {
      res.setHeader("Content-Type", contentType);
    }

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "no-store");

    const buffer = Buffer.from(await upstream.arrayBuffer());
    res.status(200).send(buffer);

  } catch (err) {
    res.status(500).send("Proxy fetch failed");
  }
}
