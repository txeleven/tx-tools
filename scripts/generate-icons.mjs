// 生成扩展图标（纯 Node 实现，无第三方依赖）
// 图标设计 v3：深海蓝(#19426C)圆角方块 + 平滑白色 TX 字母 + 左上高光
// 采用 3x3 超采样 + 线段 SDF 抗锯齿，边缘圆润平滑，无点阵马赛克
import { deflateSync } from 'zlib'
import { writeFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '..', 'public', 'icons')
mkdirSync(outDir, { recursive: true })

// ---------- PNG 编码 ----------
const CRC_TABLE = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let c = -1
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeBuf = Buffer.from(type, 'ascii')
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0
  // 每行前加 filter byte(0)
  const raw = Buffer.alloc((width * 4 + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4)
  }
  const idat = deflateSync(raw)
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ---------- 几何辅助 ----------
// 点到线段的最短距离
function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1
  const dy = y2 - y1
  const l2 = dx * dx + dy * dy
  let t = l2 ? ((px - x1) * dx + (py - y1) * dy) / l2 : 0
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy))
}

// ---------- 绘制 ----------
function drawIcon(size) {
  const S = size
  const buf = Buffer.alloc(S * S * 4)
  const set = (x, y, r, g, b, a = 255) => {
    if (x < 0 || y < 0 || x >= S || y >= S) return
    const i = (y * S + x) * 4
    buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = a
  }

  // 背景：主色 #19426C，亮 → 暗对角渐变（中值贴近主色）
  const cLight = [36, 84, 134]  // #245486
  const cDark = [17, 46, 76]    // #112E4C
  const pad = S * 0.05
  const radius = S * 0.22

  // 背景圆角矩形（支持亚像素坐标判定）
  const inBg = (px, py) => {
    const dx = Math.max(pad + radius - px, px - (S - pad - radius), 0)
    const dy = Math.max(pad + radius - py, py - (S - pad - radius), 0)
    return Math.sqrt(dx * dx + dy * dy) <= radius
  }

  // TX 字母几何：线段 + 圆头（SDF 距离场）
  const hw = S * 0.115     // 字母半宽
  const hh = S * 0.185     // 字母半高
  const r = S * 0.042      // 线宽一半（圆头半径）
  const cx = S / 2
  const cy = S / 2
  const tx = cx - (hw + S * 0.055)  // T 中心 x
  const xx = cx + (hw + S * 0.055)  // X 中心 x
  const tBarY = cy - hh + r         // T 横条中心线 y
  const tStemB = cy + hh - r        // T 竖条底部 y

  // SDF：<=0 在字母内
  const letterSDF = (px, py) => {
    const dT = Math.min(
      distToSegment(px, py, tx - hw, tBarY, tx + hw, tBarY),
      distToSegment(px, py, tx, tBarY, tx, tStemB),
    )
    const dX = Math.min(
      distToSegment(px, py, xx - hw, cy - hh, xx + hw, cy + hh),
      distToSegment(px, py, xx - hw, cy + hh, xx + hw, cy - hh),
    )
    return Math.min(dT, dX) - r
  }

  const SS = 3 // 3x3 超采样抗锯齿
  const gradient = (px, py) => {
    const t = Math.min(1, (px + py) / (2 * (S - 1)))
    return [
      cLight[0] + (cDark[0] - cLight[0]) * t,
      cLight[1] + (cDark[1] - cLight[1]) * t,
      cLight[2] + (cDark[2] - cLight[2]) * t,
    ]
  }

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      // —— 背景：超采样累加 ——
      let bgN = 0, bgR = 0, bgG = 0, bgB = 0
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = x + (sx + 0.5) / SS
          const py = y + (sy + 0.5) / SS
          if (inBg(px, py)) {
            const c = gradient(px, py)
            bgR += c[0]; bgG += c[1]; bgB += c[2]; bgN++
          }
        }
      }
      if (bgN === 0) continue // 完全在圆角外，透明
      let bg = [bgR / bgN, bgG / bgN, bgB / bgN]

      // —— 左上高光 ——
      const hx = S * 0.24, hy = S * 0.24, hr = S * 0.6
      const hd = Math.hypot(x + 0.5 - hx, y + 0.5 - hy) / hr
      if (hd < 1) {
        const w = 0.14 * (1 - hd)
        bg = [bg[0] + (255 - bg[0]) * w, bg[1] + (255 - bg[1]) * w, bg[2] + (255 - bg[2]) * w]
      }

      // —— 字母（超采样 SDF 覆盖）——
      let letterN = 0
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = x + (sx + 0.5) / SS
          const py = y + (sy + 0.5) / SS
          if (letterSDF(px, py) <= 0) letterN++
        }
      }
      const cov = letterN / (SS * SS)
      if (cov > 0) {
        const r = Math.round(bg[0] + (255 - bg[0]) * cov)
        const g = Math.round(bg[1] + (255 - bg[1]) * cov)
        const b = Math.round(bg[2] + (255 - bg[2]) * cov)
        set(x, y, r, g, b)
      } else {
        set(x, y, Math.round(bg[0]), Math.round(bg[1]), Math.round(bg[2]))
      }
    }
  }
  return buf
}

for (const size of [16, 32, 48, 128]) {
  const rgba = drawIcon(size)
  const png = encodePNG(size, size, rgba)
  writeFileSync(join(outDir, `icon${size}.png`), png)
  console.log(`✔ icon${size}.png generated (${png.length} bytes)`)
}
