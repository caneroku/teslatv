export default async function handler(req, res) {
  const target = req.query.url;
  if (!target || !target.startsWith("http")) {
    res.status(400).send("Invalid URL");
    return;
  }

  try {
    const upstream = await fetch(target, {
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

    const contentType = upstream.headers.get("content-type") || "";

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "no-store");

    // 🔥 M3U8 ise: içindeki relative URL'leri proxy'ye göre yeniden yaz
    if (contentType.includes("application/vnd.apple.mpegurl") || target.endsWith(".m3u8")) {
      let text = await upstream.text();

      const base = target.substring(0, target.lastIndexOf("/") + 1);

      text = text.replace(
        /^(?!#)(.+)$/gm,
        (line) => {
          if (line.startsWith("http")) {
            return "/api/proxy?url=" + encodeURIComponent(line);
          }
          return "/api/proxy?url=" + encodeURIComponent(base + line);
        }
      );

      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      res.status(200).send(text);
      return;
    }

    // 🔥 TS segmentler STREAM olarak aktarılır (buffer YOK)
    res.setHeader("Content-Type", contentType);
    upstream.body.pipe(res);

  } catch (err) {
    res.status(500).send("Proxy failed");
  }
}
