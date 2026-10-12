const escape = (text) =>
  String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const styles = (font) => `
@font-face { font-family: Inter; font-weight: 100 900; src: url(${font}) format('woff2'); }
* { box-sizing: border-box; }
html, body { margin: 0; }
.card { position: relative; width: 1200px; height: 630px; overflow: hidden; background: #f5f6f1; color: #18181b;
  font-family: Inter, sans-serif; -webkit-font-smoothing: antialiased; }
.logo { position: absolute; left: 72px; top: 64px; height: 40px; }
.text { position: absolute; left: 72px; top: 168px; width: 980px; }
.card--visual .text { width: 540px; }
.eyebrow { margin: 0 0 20px; font-size: 22px; font-weight: 600; color: #5502fb; }
h1 { margin: 0; font-size: 68px; line-height: 1.06; font-weight: 700; letter-spacing: -0.03em; text-wrap: balance; }
.card--visual h1 { font-size: 56px; }
.sub { margin: 24px 0 0; font-size: 28px; line-height: 1.4; color: #52525b; text-wrap: pretty; }
.card--visual .sub { font-size: 24px; }
.meta { margin: 20px 0 0; font-size: 20px; font-weight: 500; color: #71717a; }
.url { position: absolute; left: 72px; bottom: 60px; font-size: 22px; font-weight: 500; color: #71717a; }
.panel { position: absolute; left: 672px; top: 64px; width: 468px; max-height: 620px; padding: 28px 32px; background: #fff;
  border: 1px solid #e4e4e7; border-radius: 20px; box-shadow: 0 1px 2px rgb(0 0 0 / 4%), 0 16px 40px rgb(0 0 0 / 6%);
  overflow: hidden; }
.panel--clip { height: 620px; -webkit-mask-image: linear-gradient(#000 78%, transparent 96%); }
.panel img { display: block; width: 100%; }
.bar { display: flex; align-items: center; gap: 12px; margin: -28px -32px 20px; padding: 12px 18px; background: #fafafa;
  border-bottom: 1px solid #e4e4e7; }
.dots { display: flex; gap: 6px; }
.dots i { width: 10px; height: 10px; border-radius: 50%; background: #d4d4d8; }
.address { flex: 1; text-align: center; margin-right: 48px; font-size: 15px; color: #52525b; }
`

export function card({ font, eyebrow, title, subtitle, meta, form, address }) {
  const bar = address ? `<div class="bar"><span class="dots"><i></i><i></i><i></i></span><span class="address">${escape(address)}</span></div>` : ''
  const visual = form
    ? `<div class="panel${form.clip ? ' panel--clip' : ''}">${bar}<img src="${form.src}" alt=""></div>`
    : ''
  return `<!doctype html><html><head><meta charset="utf-8"><style>${styles(font)}</style></head><body>
<div class="card${visual ? ' card--visual' : ''}">
  <img class="logo" src="/brand/logo-full.svg" alt="">
  <div class="text">
    ${eyebrow ? `<p class="eyebrow">${escape(eyebrow)}</p>` : ''}
    <h1>${escape(title)}</h1>
    ${subtitle ? `<p class="sub">${escape(subtitle)}</p>` : ''}
    ${meta ? `<p class="meta">${escape(meta)}</p>` : ''}
  </div>
  <div class="url">formhaus.dev</div>
  ${visual}
</div></body></html>`
}
