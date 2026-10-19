# codefilm

**每一帧、每个音符都由代码生成的短片渲染管线。**

跑在 GitHub Actions 上，不依赖本地 GPU。

---

## 它怎么工作

```
scenes/*.html      ← 场景（WebGL / Canvas，每帧是时间的纯函数）
        ↓
scripts/render.mjs ← Puppeteer 逐帧调用 window.renderFrame(t) 并截图
        ↓
frames/*.png       ← 确定性帧序列（不受机器快慢影响）
        ↓
ffmpeg             ← 编码 MP4 + 混音轨
        ↓
renders/*.mp4      ← 自动提交回仓库，手机端直接下载
```

## 为什么不用实时录制

实时录制受 vsync、掉帧、系统调度影响，第 137 帧未必真是 `t=5.7s`。
逐帧截取则是**确定性**的：帧号即时间，可重跑、可对比、可任意分辨率。

## 触发方式

| 方式 | 说明 |
|---|---|
| `git push` | 自动跑 |
| Actions 页面 → Run workflow | 可自定义时长/分辨率/帧率 |

## 参数

| 环境变量 | 默认 | 说明 |
|---|---|---|
| `SCENE` | `scenes/smoke.html` | 场景文件 |
| `W` / `H` | 640 / 360 | 分辨率 |
| `FPS` | 24 | 帧率 |
| `SECONDS` | 2 | 时长 |
| `FRAMEDIR` | `frames` | 帧输出目录 |

## 场景契约

任何场景文件只要满足两条即可被渲染：

```js
window.__ready = true;                 // 初始化完成
window.renderFrame = (t) => { ... };   // t 为秒，必须是纯函数（同样的 t 出同样的画面）
```

## 本地运行

```bash
npm install
node scripts/render.mjs
ffmpeg -framerate 24 -i frames/%04d.png -c:v libx264 -crf 18 -pix_fmt yuv420p out/smoke.mp4
```

## 免费额度

公共仓库的 Actions 分钟数无限制；私有仓库每月 2000 分钟（本管线跑 60 秒 1080p 约 5 分钟）。