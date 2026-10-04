# N9 Render State Preservation Notes (`docs/render-rebuild-notes.md`)

## 1. 概述与分析目标

本任务解决 N9 问题（`render()` 全量 `innerHTML` 重绘）。根据项目设计原则与约束：
- **禁止过度设计**：禁止引入虚拟 DOM、前端组件框架或全局 diff 引擎；
- **排查伤害用户的真实场景**：通过可复现的「触发步骤 → 期望 → 实际」三段式验证，区分「同一屏幕交互中途状态丢失的真 Bug」与「页面跳转/换题后的正常重绘（By-Design）」；
- **最小手段定点修复**：复用项目中已有且验证过的定点更新模式（如 `renderTopbarStarsOnly`），针对高频元素走 DOM 定点更新，或确保屏幕停留交互期间不再触发全量 `render()`。

---

## 2. 候选场景调查矩阵（真实场景 vs 设计如此）

对代码库内所有 `render()` 的调用点及所有可能在屏幕停留期间触发的异步源（TTS、计时器、动画等）进行了全量排查：

| 候选来源 | 代码实现现状 | 判定 | 结论与分析依据 |
|---|---|---|---|
| **TTS 回调** | `speak()`、`playBrowserUtterance()` 均基于 `SpeechSynthesisUtterance`，事件监听 `u.onend` 与 `u.onerror` 仅执行 Promise 的 `resolve()`，无任何 `render()` 调用。 | **By-Design / 无问题** | 朗读结束不会触发页面重渲染，画布与交互状态不受 TTS 影响。 |
| **活跃计时器** | 页面每 5 秒的 `setInterval` 定时器仅通过 `ensureUsageBanner()` 更新固定的 `#usageBanner` DOM 节点，除非时间用尽进入 `timeUp`，否则不调用 `render()`。 | **By-Design / 无问题** | 定时器在正常游戏停留期间不会触发重绘。 |
| **星星动画与奖励 (`awardStar`)** | `awardStar()` 负责钻石累加与世界解锁特效 `mcWorldUnlockBurst`，不触发全量 `render()`。做题答对时的星数更新此前由局部函数 `renderTopbarStarsOnly()` 完成。 | **By-Design / 无问题** | 动画与奖励系统本身未调用全量 `render()`。 |
| **页面导航 (`go`, `goBack`, `goHome`)** | 路由切换时设置 `state.screen` 并调用 `render()`。 | **By-Design / 正常** | 换屏重绘属于预期设计，不应改动。 |
| **下一题切换 (`nextQuestion`, `nextMathQuestion`, `nextTraceItem`, `nextGradeQuestion`)** | 答对后延迟推进题目序号并调用 `render()`。 | **By-Design / 正常** | 题目完成出下一题重渲染属于预期设计，不应改动。 |
| **顶栏静音切换 (`toggleMute`)** | 顶栏按钮 `toggleMute()` 在更新 `muted` 状态后直接调用了 `render()`。 | **真实 Bug (真场景)** | 破坏停留屏幕状态（清动画布/丢失输入/重置选项）。 |
| **顶栏 Blipola 快捷键 (`blipolaVoiceAction`)** | 在静音状态下点击 Blipola 快捷键时，解除静音后调用了 `render()`。 | **真实 Bug (真场景)** | 同样触发全量重绘，导致当前屏幕交互状态丢失。 |
| **年级选词排序 (`handleGradeSortChoice`, `resetGradeSort`)** | 句子排序题中，学生每点选一个单词，由于未填满句子即调用 `render()`，点重置也调用 `render()`。 | **真实 Bug (真场景)** | 导致整张卡片频繁触发 `mc-animate-in` 入场动画闪烁，且会冲掉之前呼出的 Blipola 提示。 |

---

## 3. 真实场景复现清单（三段式复现）

### 场景 1：Draw（画板）绘画中途点击静音清空画布与撤销历史
- **触发步骤**：
  1. 进入 Draw 画板（`go('draw')`）；
  2. 在画布上绘制任意画作（生成了若干笔画和撤销历史快照）；
  3. 点击顶栏右侧的音量/静音按钮（`toggleMute()`）。
- **期望**：
  - 音频在静音与有声之间切换，顶栏静音按钮图标在 🔇 / 🔊 间切换；
  - 画布上已绘制的图案保持不变，撤销历史记录完好。
- **实际**：
  - `toggleMute()` 触发了全量 `render()`；
  - `render()` 重置了 `app.innerHTML` 并执行 `afterDrawRender()`；
  - `drawHistory = []` 被重置为空，`canvas.width` 与 `canvas.height` 被重新赋值导致画布被清空为纯白；
  - 用户的画作被彻底抹除，撤销功能无法找回。

### 场景 2：Trace（描红）描绘中途点击静音清空笔迹
- **触发步骤**：
  1. 进入 Trace 描红练习（`go('trace', ...)`）；
  2. 孩子在 `#traceCanvas` 上描红笔画；
  3. 家长或孩子点击顶栏右侧静音按钮。
- **期望**：
  - 静音切换，孩子已描画的线条完好保留。
- **实际**：
  - `toggleMute()` 调用 `render()`，`afterTraceRender()` 重新设定 `canvas.width`，画布位图直接被浏览器清空，描红进度归零。

### 场景 3：年级课文/数学输入题中途点击静音丢失输入内容与焦点
- **触发步骤**：
  1. 进入包含输入框的年级交互题（如 `#gradeNumberAnswer` 或 `#gradeTextAnswer`）；
  2. 输入了部分或完整答案，焦点仍停留在输入框内；
  3. 点击顶栏静音按钮或在静音状态下点击 Blipola 麦克风图标。
- **期望**：
  - 仅切换静音状态，输入框中的文本保留，输入焦点不被打断。
- **实际**：
  - 调用 `render()` 彻底销毁并重建了卡片 DOM，输入框被替换为新的空白元素，用户已输入的文本全部丢失。

### 场景 4：选择题做错选项后点击静音丢失禁用态
- **触发步骤**：
  1. 在 Play、MathPlay 或 Timed 做题；
  2. 点错了一个错误选项，该按钮被置为 `.incorrect` 且 `disabled = true`；
  3. 点击顶栏静音按钮。
- **期望**：
  - 错题按钮保持红色与禁用态，提示已尝试过。
- **实际**：
  - `render()` 从初始题库选项重新生成按钮，错误选项被重新激活，禁用态和重试状态丢失。

### 场景 5：年级排序题点选单词导致卡片闪烁入场与提示丢失
- **触发步骤**：
  1. 进入排序题（如 `q.type === 'sort'`）；
  2. 点击「💡 Hint」按钮，Blipola 提供了排句提示并显示在 `#gradeBlipolaMessage` 中；
  3. 孩子点击第一个词放入排序区。
- **期望**：
  - 该词进入已选框，剩余词按钮隐藏，之前的提示文字保留，卡片不重播动画。
- **实际**：
  - `handleGradeSortChoice()` 在点选每个词时调用 `render()`；
  - `renderGradeLesson()` 重建卡片，将 `#gradeBlipolaMessage` 刷回默认问候语，擦除了刚呼出的提示；
  - 卡片被添加 `.mc-animate-in` 类，每选一个词整张卡片就跳动闪烁一次。

---

## 4. 最小化修复方案与实施细节

遵循「禁止过度设计、禁止改动整体架构、禁止引入任何库」的原则，完全沿用仓库成熟的 `renderTopbarStarsOnly` 模式：

### 4.1 顶栏静音定点更新：`renderTopbarMuteOnly()`
1. 顶栏按钮增加 ID 标识：
   ```html
   <button class="icon-btn" id="muteBtn" onclick="toggleMute()">${muted ? '🔇' : '🔊'}</button>
   ```
2. 新增定点更新函数 `renderTopbarMuteOnly()`：
   ```javascript
   function renderTopbarMuteOnly() {
       const btn = document.getElementById('muteBtn') || document.querySelector('.topbar-right button[onclick="toggleMute()"]');
       if (btn) btn.textContent = muted ? '🔇' : '🔊';
   }
   ```
3. 改造 `toggleMute()` 与 `blipolaVoiceAction()`：
   - 将原先的 `render()` 替换为 `renderTopbarMuteOnly()`；
   - 彻底消除了因顶栏音频控制导致同一屏幕重绘的隐患。

### 4.2 顶栏钻石更新与版本标识保持：`renderTopbarStarsOnly()`
1. 顶栏钻石增加 `#topbarStarBadge` 标识；
2. 在 `awardStar()` 内部直接集成 `renderTopbarStarsOnly()`，确保所有题目（包括年级练习）答对时顶栏星数即时定点更新；
3. 更新时保留版本号 `<span style="...">${APP_VERSION}</span>`，避免更新后版本号文字丢失。

### 4.3 年级排序题定点更新：`renderGradeSortOnly()`
1. 将排序题的交互区域包裹于 `<div id="gradeSortContainer">`；
2. 提取 `renderGradeSortHTML(q, picked)` 纯函数；
3. 新增 `renderGradeSortOnly()`，直接更新 `document.getElementById('gradeSortContainer').innerHTML`；
4. `handleGradeSortChoice()` 与 `resetGradeSort()` 优先调用 `renderGradeSortOnly()`，避免全量 `render()` 重建卡片。

---

## 5. 验证与自检

1. **自测试脚本**：`scripts/test_render_state_preservation.js`
   - 从 `index.html` 真实提取对应函数源码（无代码副本拷贝）；
   - 静态契约断言：`toggleMute` 与 `blipolaVoiceAction` 源码中绝不包含 `render()`；
   - 动态行为测试：模拟 DOM 环境，验证音频切换、星数增加、排序题词语点选均直接走 DOM 更新，全局 `render()` 调用计数严格为 0。
2. **CI 集成**：将自检脚本加入 `.github/workflows/validate.yml` 的 `TEST_SCRIPTS` 数组。
3. **语法与规范校验**：
   - 外部所有 JS、`sw.js` 以及 `index.html` 内联块全部通过 `node --check`；
   - 所有原有自测脚本全部通过。
