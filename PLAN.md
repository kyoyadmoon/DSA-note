# DSA Notes — MVP：Sorting 互動學習站

## Context

Greenfield repo（`/Users/dmoon/dmoon/dsa-notes`），最終目標是整個 DSA 筆記站（個人學習 + 面試準備 + 教學分享），但 **MVP 範圍限縮在「排序演算法」**，兩個硬指標：

1. **動畫要漂亮** — 不是「能動就好」的工程師配色，而是要有設計感：配色、留白、typography、easing 曲線、分層高亮都要講究
2. **過程要能清楚說明** — 每一步為什麼發生、在做什麼、跟前一步的關係，讀者看完動畫要能真正理解演算法，而不只是「看到東西在移動」

技術棧：**Next.js 15 App Router + TypeScript + Tailwind v4 + MDX**，動畫主力 **Framer Motion**，程式碼高亮 **Shiki**。

MVP 的驗證方式：做完之後自己看 bubble sort / quick sort 的動畫頁面，能不能「不看文字純看動畫就看懂」，以及「配上說明後有沒有那種『喔原來是這樣』的頓悟感」。

---

## MVP 範圍（只做這些）

### 要做
- 專案骨架（Next.js + Tailwind + MDX + Shiki + Framer Motion + Vitest）
- 核心 visualizer（generator-based step player + CodePanel + Narration）
- `ArrayRenderer`（排序用，其他資料結構 post-MVP）
- 六個經典排序演算法，從最直觀到最常考：
  1. **Bubble sort** — 第一個做，驗證整條 pipeline
  2. **Selection sort** — 對比 bubble 的「找最小值」思路
  3. **Insertion sort** — 手牌比喻，引入「已排序區 / 未排序區」概念
  4. **Merge sort** — 第一個分治，需要展示「分 → 合」兩階段
  5. **Quick sort** — pivot 選擇、partition 動畫，最有教學價值
  6. **Heap sort** — 引入 heap 概念（MVP 只做 array 版，樹形視覺化可以 post-MVP）
- 一個 sorting 總覽頁，把六個演算法並排對比（相同輸入同步播放）
- 簡單的 landing page（目前只有 sorting 這一個分類）
- 部署到 Vercel

### 不做（明確列出避免 scope creep）
- Fundamentals、Searching、Trees、Graphs、DP、Backtracking 所有筆記
- `LinkedListRenderer`、`TreeRenderer`、`GraphRenderer`、`MatrixRenderer`
- 全站搜尋、深色模式切換器（直接固定深色或淺色其中一個就好）
- i18n、英文版
- 使用者自訂輸入以外的互動（例如題目測驗）

MVP 做完再根據實際體驗決定下一步要擴到 searching 還是 trees。

---

## 核心架構：Step Generator 模式

關鍵抽象 —— 演算法寫成 generator，在重要時刻 `yield` 當前狀態，step player 播放這些 snapshot。

```ts
// lib/types/step.ts
export type Phase =
  | 'idle' | 'compare' | 'swap' | 'select-min'
  | 'insert' | 'partition' | 'merge' | 'done';

export type ArrayStep = {
  array: number[];

  // 指標：multi-pointer 演算法（i, j, pivot, left, right）都用這個
  pointers?: { name: string; index: number; color?: string }[];

  // 狀態著色
  comparing?: [number, number];     // 藍色
  swapping?: [number, number];      // 橘色
  sorted?: number[];                // 綠色
  active?: [number, number];        // 淡藍色背景（"目前正在處理的區間"）
  pivot?: number;                   // 紫色

  // 說明系統（見下節）
  phase: Phase;
  codeLine: number;
  title: string;      // 粗體短標題，例如 "比較 a[3] 與 a[4]"
  detail: string;     // 一句話解釋為什麼這一步重要
};
```

**範例 — bubble sort：**

```ts
export function* bubbleSortSteps(input: number[]): Generator<ArrayStep> {
  const arr = [...input];
  const n = arr.length;
  yield { array: [...arr], phase: 'idle', codeLine: 1,
          title: '開始排序', detail: `輸入共 ${n} 個元素，從左到右掃描` };

  for (let i = 0; i < n - 1; i++) {
    yield { array: [...arr], sorted: range(n - i, n), phase: 'idle',
            codeLine: 3, title: `第 ${i + 1} 輪開始`,
            detail: `目標是把這輪最大值「冒泡」到右邊第 ${n - i} 格` };

    for (let j = 0; j < n - 1 - i; j++) {
      yield { array: [...arr], comparing: [j, j + 1], sorted: range(n - i, n),
              phase: 'compare', codeLine: 5,
              title: `比較 a[${j}] 與 a[${j + 1}]`,
              detail: arr[j] > arr[j + 1]
                ? `${arr[j]} > ${arr[j + 1]}，需要交換` 
                : `${arr[j]} ≤ ${arr[j + 1]}，順序正確，跳過` };

      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        yield { array: [...arr], swapping: [j, j + 1], sorted: range(n - i, n),
                phase: 'swap', codeLine: 6,
                title: `交換 a[${j}] ↔ a[${j + 1}]`,
                detail: `較大的值往右移一格` };
      }
    }
  }
  yield { array: [...arr], sorted: range(0, n), phase: 'done',
          codeLine: 10, title: '完成', detail: '所有元素已就位' };
}
```

**要點：** 每個 `yield` 都帶 `title`（螢幕主要顯示）+ `detail`（旁白說明）+ `phase`（讓 renderer 決定用什麼顏色、動畫曲線），這就是「過程清楚說明」的落實處。

---

## 動畫與視覺設計（「要漂亮」的具體做法）

### 配色系統（Tailwind tokens）
定義一套固定的語意色板，全站共用：
```
--color-bar-idle:      slate-300 / slate-700 (dark)
--color-bar-active:    slate-400 background（「正在處理的區間」）
--color-bar-compare:   sky-500（比較中，會加 pulse）
--color-bar-swap:      orange-500（交換瞬間，閃一下）
--color-bar-pivot:     violet-500（quick sort）
--color-bar-sorted:    emerald-500（已就位，最終色）
```
每個 bar 在不同 phase 間轉換時帶 `transition` 顏色漸變，不是 snap。

### ArrayRenderer 設計細節
- **Bar 呈現：** 高度正比於值，寬度等分，用 rounded-top（`rounded-t-md`）、subtle shadow、bar 內顯示數字
- **位置動畫：** Framer Motion `layout` prop + stable key（每個元素給 id，不用 index 當 key）
  - 交換時用 `spring` easing（`stiffness: 300, damping: 24`），有彈跳感但不過度
  - 比較時 bar 往上「抬一下」（`y: -8`），強調「被拿起來比」的感覺
  - swap 時兩個 bar 各往上抬再交換位置，有「拋接」的視覺暗示
- **Pointer 標記：** 每個指標是一個小三角形 + 文字 label 在 bar 上方，用 `AnimatePresence` + `layoutId` 讓指標在索引變化時滑過去（不是瞬移）
- **Sorted 區域：** 用淡淡的綠色背景條（不是實心綠 bar），視覺上表示「這個區間已經鎖定」
- **Pivot 強調（quick sort）：** 頂上加一個紫色 badge「pivot」
- **分治動畫（merge sort）：** 當前處理的 subrange 用淡色背景框起來，分治時用 `layoutId` 動畫「一分為二」的感覺

### 版面配置
```
┌─────────────────────────────────────────────┐
│  Bubble Sort              [Reset] [Random]  │
│  O(n²) · Stable · In-place                  │
├───────────────────────┬─────────────────────┤
│                       │                     │
│    ArrayRenderer      │   CodePanel         │
│    (主視覺區)          │   (當前行高亮)       │
│                       │                     │
├───────────────────────┴─────────────────────┤
│  ▶ ⏸ ⏮ ⏭   ━━━━━●━━━━  1x  2x  4x          │  ← StepPlayer
├─────────────────────────────────────────────┤
│  第 2 輪：比較 a[3] 與 a[4]                  │  ← Narration.title
│  8 > 5，需要交換，較大值往右推進              │  ← Narration.detail
└─────────────────────────────────────────────┘
```
整體 generous padding、serif 標題（例如 `Fraunces` 或 `Instrument Serif`）+ sans body（Inter / Geist），避免「工程文件感」。

### StepPlayer 的小細節
- 進度條顯示所有步驟，用不同顏色段區分 phase（視覺上就能看到「這個演算法有幾輪、每輪大概多長」）
- 上/下一步按鍵綁定 `←` `→`，空白鍵 play/pause
- 速度選擇 0.5x / 1x / 2x / 4x，用按鈕而不是下拉選單（更快切換）
- 播放完自動停在最後一步（不 loop），右下角顯示 "Done ✓"

---

## 「過程清楚說明」的三層策略

1. **動畫層（不用文字也看得懂）** — 顏色、指標、layout 動畫本身要自解釋
2. **即時旁白層（Narration 元件）** — 每步的 `title` + `detail`，跟著動畫同步切換
3. **整體說明層（MDX 筆記文字）** — 動畫上方的 markdown 內容講述演算法思想、複雜度、適用場景、常見變形

MDX 每篇筆記固定結構：

```mdx
# Bubble Sort

## 直覺
（白話解釋為什麼這個做法會成功，像在跟朋友講）

## 互動動畫
<AlgorithmRunner source={bubbleSortSource} steps={bubbleSortSteps} initial={[5,2,8,1,9,3]} />

## 為什麼會動？
（用文字補充動畫沒講到的：不變量、為什麼第 i 輪結束後最後 i 個元素就定位）

## 複雜度
- 時間：最好 O(n)（已排序時加 early exit）、平均/最壞 O(n²)
- 空間：O(1) in-place
- 穩定：是

## 跟其他排序的比較
（一句話：什麼時候會用 bubble sort？幾乎不會，但它是理解「相鄰交換」的起點）

## 常見題型
（LeetCode 連結，或自己想到的變形）
```

---

## 目錄結構（MVP 版）

```
/app
  layout.tsx                      # sidebar + 主題色設定
  page.tsx                        # landing（目前只列 sorting）
  /sorting/
    page.mdx                      # sorting 總覽 + 六個演算法並排對比
    /bubble-sort/page.mdx
    /selection-sort/page.mdx
    /insertion-sort/page.mdx
    /merge-sort/page.mdx
    /quick-sort/page.mdx
    /heap-sort/page.mdx
  /sandbox/page.tsx               # 開發用測試頁，MVP 後可移除

/components
  /visualizer/
    AlgorithmRunner.tsx           # 包 steps + renderer + player + narration
    StepPlayer.tsx                # play/pause/prev/next/speed/scrubber
    CodePanel.tsx                 # Shiki 高亮 + 當前行 highlight
    Narration.tsx                 # title + detail
  /renderers/
    ArrayRenderer.tsx             # MVP 唯一 renderer
  /layout/
    Sidebar.tsx
    PageHeader.tsx                # 演算法頁的標題區（名稱 + tags）

/lib
  /algorithms/
    /sorting/
      bubbleSort.ts
      selectionSort.ts
      insertionSort.ts
      mergeSort.ts
      quickSort.ts
      heapSort.ts
      index.ts                    # barrel + metadata（名稱、複雜度、tags）
  /types/
    step.ts
  /utils/
    range.ts

/tests
  /sorting/*.test.ts              # vitest：驗證 sort 結果正確

package.json, tsconfig.json, next.config.mjs, tailwind.config.ts,
postcss.config.mjs, .gitignore, README.md
```

**每個 `lib/algorithms/sorting/*.ts` 都 export 三樣東西：**
```ts
export function bubbleSort(arr: number[]): number[] { ... }      // 本體，可測試
export function* bubbleSortSteps(arr: number[]): Generator<ArrayStep> { ... }
export const bubbleSortSource: string = `...`;                   // 原始碼字串，給 CodePanel
export const bubbleSortMeta = {
  name: 'Bubble Sort',
  slug: 'bubble-sort',
  timeBest: 'O(n)', timeAvg: 'O(n²)', timeWorst: 'O(n²)',
  space: 'O(1)', stable: true, inPlace: true,
  tags: ['入門', '相鄰交換'],
};
```

---

## 實作階段（MVP）

### Phase 0 — 骨架（半天）
- `create-next-app` → TS、Tailwind v4、App Router
- 安裝 `@next/mdx`、`rehype-pretty-code`、`shiki`、`framer-motion`、`vitest`、`@testing-library/react`
- `next.config.mjs` 設定 MDX、rehype-pretty-code
- `tailwind.config.ts` 加入語意色 token（bar-idle/compare/swap/sorted/pivot）
- 字型：引入 Fraunces (serif) + Inter (sans)
- `app/layout.tsx` 建立基本 shell，`app/page.tsx` 先放 placeholder landing

### Phase 1 — 核心 visualizer + bubble sort（MVP 核心）
這是整個 MVP 成敗的關鍵 phase，要做到「bubble sort 單頁就好看到讓自己想 demo 給別人看」。

1. `lib/types/step.ts` 定義 `ArrayStep`、`Phase`
2. `components/renderers/ArrayRenderer.tsx`
   - 接 `ArrayStep`，渲染 bars + pointers + sorted 背景
   - Framer Motion `layout` 處理位置、顏色、`y` 抬起動畫
   - 先獨立測試：寫 `/sandbox` 頁手動餵幾個 step，確認視覺效果漂亮
3. `components/visualizer/StepPlayer.tsx`
   - 狀態：`currentStep`、`isPlaying`、`speed`
   - `useEffect` 的 setInterval 播放；`currentStep` 改變時 parent 會 re-render
   - 鍵盤綁定、scrubber（input type=range）
4. `components/visualizer/CodePanel.tsx`
   - 用 Shiki build-time 高亮整段程式碼（或 runtime，視 bundle 大小決定）
   - `currentLine` prop，對應行加 `bg-sky-500/20` 高亮 + 左側 accent bar
5. `components/visualizer/Narration.tsx` — 簡單，title（serif, larger）+ detail（sans, muted）
6. `components/visualizer/AlgorithmRunner.tsx`
   - Props: `steps: Generator<ArrayStep>`（或 factory）、`source: string`、`initial: number[]`
   - 預先跑 generator 收集所有 steps 成 array（以支援 scrubber 任意跳轉）
   - 組合 ArrayRenderer + CodePanel + StepPlayer + Narration
   - 提供 Reset / Random 按鈕
7. `lib/algorithms/sorting/bubbleSort.ts`（完整三 exports）
8. `app/sorting/bubble-sort/page.mdx` — 第一篇筆記

**Phase 1 驗證點：**
- 自己打開 `/sorting/bubble-sort`，從頭播到尾，對以下三點有感：
  - 動畫有設計感（配色、間距、easing 都經過調整）
  - 每一步的 title/detail 讓人一看就懂
  - 程式碼高亮與動畫完全同步
- 如果任何一點不滿意，先回來打磨 Phase 1，不要往 Phase 2 跑

### Phase 2 — 其餘五個排序演算法
每個演算法的流程：
1. 實作 `xxxSort.ts`（三 exports）
2. 建立 MDX 頁面
3. 檢查是否需要 ArrayRenderer 新增狀態（例如 quick sort 的 pivot、merge sort 的 subrange highlight）
4. 寫 vitest 驗證正確性

順序建議：`selection → insertion → quick → merge → heap`
- 先做 selection/insertion 因為跟 bubble 很接近，可以快速驗證 runner 的通用性
- 再做 quick（引入 pivot 視覺狀態）
- 再做 merge（引入 subrange / 分治 layout 動畫，ArrayRenderer 要加「多區塊並存」支援）
- 最後 heap（MVP 只做 array 版，不畫 tree）

### Phase 3 — Sorting 總覽頁 + landing + 部署
- `/sorting/page.mdx` 六個演算法並排對比頁：
  - 六個縮小版 ArrayRenderer 同時播放相同輸入
  - 共用一個 StepPlayer（同步播放）
  - 終點時間不同 → 誰先完成一眼看出效率差異
- `/` landing 放 hero + sorting 入口
- README 寫安裝 / 開發 / 部署步驟
- 部署到 Vercel

### Phase 4 —（MVP 之外）評估要不要繼續
- 回頭看整站體驗，決定下一步是 searching、trees 還是先寫 fundamentals

---

## 關鍵技術選擇（MVP 相關）

| 項目 | 選擇 | 理由 |
|---|---|---|
| Framework | Next.js 15 App Router | MDX 整合、RSC、Vercel 零設定 |
| Styling | Tailwind v4 | 快速、token 管理方便 |
| 動畫 | Framer Motion | `layout` prop 處理陣列位置變化天生契合 |
| Code HL | Shiki via `rehype-pretty-code` | 準確、build-time、支援 line highlight |
| MDX | `@next/mdx` | 筆記 + React 元件共存 |
| 測試 | Vitest | 單元測 sort 正確性 |
| 部署 | Vercel | 與 Next.js 相性最好 |

**刻意不採用：** Canvas、D3 render、state management library、i18n、search library（MVP 不需要）。

---

## 關鍵檔案清單

專案是空的，全部新建。MVP 最重要的核心檔案：

- `lib/types/step.ts` — 所有動畫的共通型別
- `components/renderers/ArrayRenderer.tsx` — 視覺品質的主要來源
- `components/visualizer/AlgorithmRunner.tsx` — 組裝中樞
- `components/visualizer/StepPlayer.tsx`、`CodePanel.tsx`、`Narration.tsx`
- `lib/algorithms/sorting/bubbleSort.ts` — 第一個 end-to-end 驗證
- `app/sorting/bubble-sort/page.mdx` — 第一篇筆記
- `tailwind.config.ts` — 語意配色 token
- `next.config.mjs` — MDX + rehype-pretty-code 設定

---

## 驗證方法

### 開發時
```bash
bun dev  # or pnpm dev
```

### Phase 1 完成後
打開 `http://localhost:3000/sorting/bubble-sort`：
1. **漂亮檢查：** 截圖放桌布會不會覺得醜？配色、字型、留白是否耐看？
2. **清楚檢查：** 找一個「完全不懂 bubble sort 的朋友」看動畫 + 旁白，問他「看完有沒有懂在幹嘛」—— 這是 MVP 最重要的驗證
3. **功能檢查：**
   - play/pause/prev/next/scrubber/speed 全部正常
   - 程式碼高亮與動畫同步
   - Random 換資料後重播正常
   - `←`/`→`/空白鍵 shortcut 生效

### Phase 2 每個演算法完成後
```bash
bun test  # vitest 驗證 sort 結果對 1000 次 random input 都正確
```
每個演算法頁面都要過一次 Phase 1 的「漂亮 + 清楚」雙檢查。

### Phase 3 完成後
- 總覽頁六個動畫同步播放無視覺 bug
- Lighthouse 跑 sorting 頁面，Performance ≥ 90
- 部署到 Vercel 後用手機打開檢查 responsive

---

## Post-MVP 路線圖（留作參考，MVP 不做）

- Stage 1 Fundamentals（Big-O、array、linked list、stack/queue、hash table、recursion）
- Stage 3 Searching
- Stage 4 Trees（需要 TreeRenderer）
- Stage 5 Graphs（需要 GraphRenderer）
- Stage 6 DP / Backtracking（需要 MatrixRenderer）
- Stage 7 進階（KMP、segment tree 等）
- 全站搜尋（pagefind）
- 深色模式切換
- 英文版 i18n
- 自訂輸入（貼 array 進去看動畫）
- 題目模式（LeetCode 題號對應）
