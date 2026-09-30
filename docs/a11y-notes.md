# N10 Accessibility Notes & Keyboard Navigation Audit (`docs/a11y-notes.md`)

## 1. 概述与核心原则

本轮无障碍优化聚焦 **N10 报告点名的具体缺口（Concrete Gaps）**，坚决避免无边界的「全站 WCAG 审计表演」，遵循以下硬约束：
- **最小差异原则（Minimal Diff）**：仅修复明确指出的 4 项缺口，不引库、不重构既有渲染管道；
- **视觉零变更**：不改动任何视觉样式与布局，不调整配色或对比度（颜色对比度作为单独的可验证任务推迟，见第 4 节）；
- **依靠浏览器原生语义**：优先依赖原生 `<button>` 与 `<input>` 的默认 Tab 导航与 Enter/Space 激活机制，坚决不向原生按钮滥加无意义的 `tabindex="0"`。

---

## 2. 本轮已修复的四项具体缺口

### 1) 答题反馈区 `aria-live="polite"`
- **问题分析**：在 Grade 课程答题、选词排句、填空验证，以及常规做题的连胜激励与提示区域，内容属于「原地局部更新」，屏幕阅读器用户在按键或点击后无法得知即时反馈。
- **解决方式**：
  - 参考已有的 `world-detail` 先例（`<div class="world-detail" aria-live="polite">`）；
  - 年级答题反馈区：`<div id="gradeFeedback" class="grade-feedback" aria-live="polite"></div>`；
  - 年级 Blipola 提示区：`<span id="gradeBlipolaMessage" aria-live="polite">`；
  - 测验连胜徽章区：`<div id="streakBadge" class="streak-badge" aria-live="polite"></div>`；
  - 测验 Blipola 提示区：`<span id="blipolaMessage" aria-live="polite">`；
  - **边界把控**：只加在原地更新的区域，对整屏重建的页面（如常规 Math 换题重新 `render()`）不滥加 `aria-live`，避免阅读器重复朗读全屏。

### 2) 纯图标按钮增加可访问名（`aria-label`）
- **问题分析**：顶栏与工具栏中部分按钮仅包含 Emoji 图标（如 🔊、🎤、🏠、🧹、✕），无可见文本或标题属性不足，无障碍树中缺失明确名称。
- **解决方式**：
  - 顶栏后退：`<button class="icon-btn" onclick="goBack()" aria-label="Go back">⬅️</button>`；
  - 顶栏主页：`<button class="icon-btn" onclick="goHome()" aria-label="Home">🏠</button>`；
  - 顶栏 Blipola 语音：`<button class="icon-btn" onclick="blipolaVoiceAction()" title="Blipola Voice" aria-label="Blipola Voice">🎤</button>`；
  - 顶栏静音切换：`<button class="icon-btn" id="muteBtn" onclick="toggleMute()" aria-label="${muted ? 'Unmute sound' : 'Mute sound'}">${muted ? '🔇' : '🔊'}</button>`；
  - 静音局部更新联动：`renderTopbarMuteOnly()` 在更新图标的同时同步更新 `aria-label`；
  - 描红工具栏：朗读发音加 `aria-label="Hear pronunciation"`，清屏加 `aria-label="Clear canvas"`；
  - 画板工具栏：清屏加 `aria-label="Clear canvas"`；
  - 世界详情弹窗：关闭按钮加 `aria-label="Close"`；
  - **边界把控**：题目选项、卡片等已有可见文字的内容型 Emoji 按钮不追加冗余属性。

### 3) 换屏后焦点管理（Focus Management）
- **问题分析**：`render()` 每次切换页面时会重写 `#app.innerHTML`，导致原先获得焦点的元素被从 DOM 树中销毁，键盘/屏幕阅读器焦点丢失重置到 `body` 或地址栏，用户无法感知内容已更新。
- **解决方式**：
  - 在 `#app` 容器上设置 `tabindex="-1"`（并在 CSS 中配置 `#app:focus { outline: none; }` 杜绝外观跳动）；
  - 在 `render()` 函数末尾执行焦点转移：
    ```javascript
    if (app) {
        if (!app.hasAttribute('tabindex')) {
            app.setAttribute('tabindex', '-1');
        }
        const active = document.activeElement;
        const isInputActive = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
        if (!isInputActive && typeof app.focus === 'function') {
            app.focus({ preventScroll: true });
        }
    }
    ```
  - **防回归保障**：
    - 输入框保护：若当前活跃元素为输入框/文本域，不抢夺焦点；
    - 滚动保护：调用时传入 `{ preventScroll: true }`，防止页面发生非预期的视口跳动与地址栏伸缩。

### 4) 主流程键盘可达性覆盖
- **主流程覆盖**：
  - 顶栏按钮（后退、主页、语音、静音）：均为原生 `<button class="icon-btn">`，默认可通过 Tab 键顺序聚焦，Enter/Space 触发；
  - 首页主入口：
    - 年级卡片：原生 `<button class="home-grade-card ...">`；
    - 今日复习按钮：原生 `<button class="review-btn" onclick="startReview()">`；
    - 今日探险卡片：卡片内的 `<button class="big-btn play" onclick="startTodayAdventure()">` 绑定了明确的点击回调，键盘 Tab 聚焦至按钮按下 Enter 即可启动探险；
    - 底部学习工具：原生 `<button class="home-tool">`；
  - Quiz 与 Math 答题选项：
    - 语言/字母等测验：原生 `<button class="choice-btn">`；
    - 年级交互题：原生 `<button class="grade-choice">`、`<button class="grade-text-submit">`、`<input id="gradeNumberAnswer">` 等；
  - 保持规范：主流程所有原生按钮保持纯净，不额外添加多余的 `tabindex`。

---

## 3. 全站交互元素盘点与 `div onclick` 现状清单

通过全局扫描，全站共有 101 处原生 `<button>` / `<input>`，以及 11 处带有 `onclick` 的 `<div>`。

### 11 处 `div onclick` 盘点明细表

| 序号 | 元素与定位 | 交互功能 | 判定归类 | 现状与未来改造建议 |
|---|---|---|---|---|
| 1 | `index.html:2906` `<div class="today-card" onclick="...">` | 首页「今日探险」大卡片 | **主流程（已在本轮覆盖）** | 该 div 作为卡片容器，内部包含原生 `<button class="big-btn play">`。本轮已为内部 `<button>` 增加显式 `onclick`，键盘 Tab 直接聚焦并激活该按钮。后续可将外部容器改为单纯包裹层或语义卡片。 |
| 2 | `index.html:2945` `<div class="star-badge" id="topbarStarBadge" onclick="handleDebugTap()">` | 顶栏钻石数/版本号，连续点击 5 次激活调试模式 | **长尾诊断（彩蛋）** | 面向家长/开发者的隐藏彩蛋，非儿童常规流程。未来可考虑为其增加键盘专用激活快捷键或隐藏在家长设置内。 |
| 3 | `index.html:2925` `<div class="card" onclick="go('category', ...)">` | Level 选择器（`renderLevelPicker`）关卡卡片 | **长尾浏览（次级主线）** | 当前为 `div.card`。未来建议重构为 `<button class="card" type="button">`，并在 CSS 中重置默认 button 边框/字体继承。 |
| 4 | `index.html:3112` `<div class="card" onclick="learnTap(...)">` | 认读卡片（`renderLearn`）朗读互动 | **长尾浏览** | 朗读展示卡片。未来建议将卡片整体改为 `<button type="button" class="card">`，或在内部添加发音按钮。 |
| 5 | `index.html:6229` `<div class="card" onclick="learnTap(...)">` | 自由画廊（`renderFreeplay`）点击发音 | **长尾功能** | 同上，属于发音互动卡片，后续建议转为 `<button type="button">`。 |
| 6 | `index.html:5931` `<div class="course-card" onclick="...">` | 年级大纲页（`renderGrades`）课程列表卡片 | **长尾导航** | 卡片点击进入对应年级单元。后续建议改为 `<button class="course-card" type="button">`。 |
| 7 | `index.html:4088` `<div class="color-swatch" onclick="pickTraceColor(...)">` | 描红（`renderTrace`）颜色选板圆点 | **长尾工具** | 当前仅支持鼠标/触摸点选。后续建议重构为 `<button type="button" class="color-swatch" aria-label="Color ${name}">`。 |
| 8 | `index.html:6087` `<div class="draw-swatch" onclick="pickDrawColor(...)">` | 画板（`renderDraw`）调色板圆点 | **长尾工具** | 画板画笔选色。后续建议改为原生 `<button type="button">` 或单选按钮组。 |
| 9 | `index.html:6089` `<div class="draw-size-btn" onclick="pickDrawSize(...)">` | 画板（`renderDraw`）笔刷尺寸选择 | **长尾工具** | 画笔粗细选钮。后续建议改为 `<button type="button">`。 |
| 10 | `index.html:6091` `<div class="draw-tool-btn" id="eraserBtn" onclick="toggleEraser()">` | 画板（`renderDraw`）橡皮擦切换 | **长尾工具** | 工具切换开关。后续建议改为带有 `aria-pressed` 的原生 `<button type="button">`。 |
| 11 | `index.html:6092` `<div class="draw-tool-btn" id="undoBtn" onclick="undoDraw()">` | 画板（`renderDraw`）撤销一步 | **长尾工具** | 操作按钮。后续建议改为原生 `<button type="button" aria-label="Undo">`。 |

---

## 4. 后续规划（Future Work / Out of Scope）

以下内容按本次任务硬约束明确跳过，留待后续独立任务验证：
1. **对比度审计与配色微调（Contrast Verification）**：
   - 当前 Minecraft 风格面板使用了特定的大地色、金色与木纹色背景；
   - 对比度调整将直接改变页面视觉呈现，属于独立的可视觉回归验证任务，本轮不予修改。
2. **长尾画板与色板的键盘导航支持**：
   - 将 Draw/Trace 的调色板与尺寸按钮转为 `role="radiogroup"` 或 `<button>`，并提供方向键切换支持。
3. **Canvas 画布可访问性替代**：
   - 描红与画板属于纯手写笔迹体验，屏幕阅读器环境下未来可增加语音辅助模式或描述性提示。
