export default async function handler(req, res) {
  const url = req.query.url;
  if (!url) {
    res.status(400).send("URL missing");
    return;
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "okhttp/4.10.0",
        "Referer": url,
        "Accept": "*/*"
      }
    });

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Content-Type",
      response.headers.get("content-type") || "application/vnd.apple.mpegurl"
    );

    response.body.pipe(res);
  } catch (err) {
    res.status(500).send("Proxy error");
  }
}
