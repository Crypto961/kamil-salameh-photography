<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9"
    xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
<xsl:output method="html" encoding="UTF-8" indent="yes"/>
<xsl:template match="/">
<html lang="en">
<head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <meta name="robots" content="noindex"/>
    <title>Sitemap | Kamil Salameh Photography</title>
    <style>
        body { margin: 0; background: #0b0f12; color: rgba(255,255,255,.8); font: 15px/1.6 system-ui, -apple-system, "Segoe UI", sans-serif; }
        main { width: min(980px, calc(100% - 32px)); margin: 0 auto; padding: 64px 0; }
        .label { color: #6FAFC7; font-size: 11px; letter-spacing: .28em; text-transform: uppercase; font-weight: 600; }
        h1 { color: #fff; font-weight: 300; font-size: clamp(32px, 5vw, 48px); letter-spacing: -.03em; margin: 12px 0 8px; }
        p { margin: 0 0 32px; color: rgba(255,255,255,.6); }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; color: #fff; font-size: 11px; letter-spacing: .18em; text-transform: uppercase; font-weight: 600; padding: 12px; border-bottom: 1px solid rgba(255,255,255,.2); }
        td { padding: 14px 12px; border-bottom: 1px solid rgba(255,255,255,.08); vertical-align: top; }
        a { color: #fff; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .muted { color: rgba(255,255,255,.5); white-space: nowrap; }
    </style>
</head>
<body>
<main>
    <div class="label">Kamil Salameh Photography</div>
    <h1>XML Sitemap</h1>
    <p>This sitemap helps search engines discover the pages and photographs on this website. It lists <xsl:value-of select="count(s:urlset/s:url)"/> pages and <xsl:value-of select="count(s:urlset/s:url/image:image)"/> images.</p>
    <table>
        <thead><tr><th>Page</th><th>Images</th><th>Priority</th><th>Updated</th></tr></thead>
        <tbody>
        <xsl:for-each select="s:urlset/s:url">
            <tr>
                <td><a href="{s:loc}"><xsl:value-of select="s:loc"/></a></td>
                <td class="muted"><xsl:value-of select="count(image:image)"/></td>
                <td class="muted"><xsl:value-of select="s:priority"/></td>
                <td class="muted"><xsl:value-of select="s:lastmod"/></td>
            </tr>
        </xsl:for-each>
        </tbody>
    </table>
</main>
</body>
</html>
</xsl:template>
</xsl:stylesheet>
