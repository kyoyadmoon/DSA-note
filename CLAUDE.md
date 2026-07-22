@AGENTS.md

# DSA Notes — 專案規則

## Scope / 目標
- 這是 DSA（資料結構與演算法）互動筆記站。MVP 範圍鎖定在 **sorting**，做完六個經典排序（bubble / selection / insertion / merge / quick / heap）再談擴充。
- 每一題要同時滿足兩個硬指標：**動畫要漂亮**、**過程要能清楚說明**。打破其中任何一個都不算完成。
- 主要讀者是作者自己（複習）、面試準備、分享給他人。筆記用繁體中文，程式碼與識別子用英文。

## Tech Stack
- **Next.js 16 (App Router) + React 19 + TypeScript (strict)**。next.config.ts 設定 `turbopack.root = path.dirname(fileURLToPath(import.meta.url))`，不要用 `__dirname`（ESM 環境是 undefined，會讓 PostCSS 誤把 `/Users/dmoon` 當成 workspace root）。
- **Tailwind v4**，所有語意色 token 定義在 `app/globals.css` 的 `@theme` 區塊（`--color-bar-idle/active/compare/swap/pivot/sorted`、`--color-accent` 等）。不要硬寫色碼，都經過 token。
- **MDX via `@next/mdx`**，已啟用 `remark-gfm`（為了 GFM table）與 `rehype-pretty-code` + Shiki 主題 `github-dark-dimmed`。Turbopack 下 plugin 必須以 string 形式傳入（`"remark-gfm"`），不能傳 function。
- **Framer Motion** 負責所有元素位置/狀態動畫。
- **Shiki** 只在 server side 跑（`lib/highlight.ts`），產出 per-line HTML 字串，client 接收後用 `dangerouslySetInnerHTML` 渲染。不要把 shiki 帶進 client bundle。
- **Vitest + happy-dom + @testing-library/react**。測試 runner 用 `pnpm test`。
- 沒有 tailwind.config.ts（v4 CSS-first），沒有 state management library（component local state 夠用），沒有 i18n。

## 演算法模組格式
每個 `lib/algorithms/<category>/<name>.ts` 必須 export 四樣東西：

```ts
export function xxxSort(input: number[]): number[]           // 純函式，可測試
export function xxxSortSteps(input: number[]): ArrayStep[]    // step generator 的結果陣列
export const xxxSortSource: string                            // 程式碼字串，給 CodePanel 顯示
export const xxxSortMeta: AlgorithmMeta                       // name/slug/complexity/stable/inPlace/tags
```

然後把這個 entry 加到 `lib/algorithms/registry.ts` 的 `registry` object，用 slug 當 key。`AlgorithmRunner` 是 async RSC，會用 slug 到 registry 拉資料、用 Shiki 把 source 高亮後交給 `AlgorithmRunnerClient` 繪製。

### Step 設計規則
每個 `ArrayStep` 都必須帶齊 `phase` / `codeLine` / `title` / `detail`：
- `title` 是**粗體短標題**（例：「比較 a[3] 與 a[4]」），在動畫旁邊的 Narration 顯示
- `detail` 是**一句話解釋為什麼這一步重要**，最好包含實際的數值（`${items[j].value} > ${items[j+1].value}，需要交換`），讓讀者看一眼就懂
- `codeLine` 要對齊 `xxxSortSource` 的真實行號（從 1 開始數）

每個 `ArrayItem` 要有**穩定的 `id`**，在整個 steps 序列中不變，只有 `value` 跟所在 index 會變動。這是 Framer Motion `layout` 動畫能正確追蹤元素交換的前提。**絕對不要用 index 當 React key**，永遠用 `item.id`。

## 視覺設計規則

### 動畫區塊（ArrayRenderer）
- **每個 array element 一律用正方塊**（`aspect-square`），固定最大邊長 `MAX_SQUARE = 84`，`flex-1` 搭配 `max-w` 讓元素在寬度有限時自動縮小。高度**不要用來表達 value 大小**——值的大小由方塊內的數字傳達，色彩傳達狀態。
- **Square 的數字要垂直居中**（`items-center justify-center`），不要放在底部。字體 `font-mono text-xl font-bold tabular-nums`。
- **Pointer 疊在 squares 上方，absolute + `bottom-full` 定位**，才不會和元素重疊又不會離得太遠（隔 `mb-5` = 20px，足以容納元素浮起 -10px 且保持間距）。**不要**把 pointer 放在另一個 flex row 然後 squares 用 `items-center` 置中——那樣 pointer 和 square 之間會有一大段空白。
- pointer overlay 的 slots 用 `Array.from({length: n})` **依 index 渲染**（不是依 item.id），因為 pointer 是「指著某個位置」而不是「跟著某個元素移動」。兩個 layer（pointer overlay + squares row）都用 `flex justify-center gap-3` + `flex-1 max-w-[MAX_SQUARE]`，結構一致 → 同一個 index 的 pointer slot 和 square 會對齊。
- Pointer 跨 slot 移動用 `layoutId={\`pointer-\${name}\`}` + `AnimatePresence mode="popLayout"`，Framer Motion 會自動算出兩個 slot 中心的位移並 spring 動畫過去。
- **Loop 變數要同時標示**：例如 bubble sort 要同時畫 `i` 和 `j` 兩個 pointer，quick sort 會有 `pivot` + `left` + `right`，merge sort 會有 `lo`/`mid`/`hi`。只畫一個 pointer 對讀者理解流程幫助有限。不同 pointer 用 `Pointer.color` 區分：慣例是 `j`（當前比較位置）用 `var(--color-accent)` sky，`i` / 外層迴圈變數用 `var(--color-bar-pivot)` violet。

### 配色（語意）
- `bar-idle` slate 灰 — 未處理
- `bar-active` — 目前處理的子區間背景
- `bar-compare` sky blue — 比較中
- `bar-swap` orange — 交換瞬間
- `bar-pivot` violet — quick sort pivot
- `bar-sorted` emerald — 已就位
- `accent` sky blue — UI 強調色（pointer、當前 code line、active tabs）

切換狀態時顏色走 `duration: 0.22` 漸變，不 snap。

### 排版
- 全站用 **grid 三欄** `md:grid-cols-[15rem_minmax(0,1fr)_15rem]`：左 sidebar / 中內容 / 右 spacer。這樣主內容相對**視窗**置中，不會因為 sidebar 導致視覺偏左。右 spacer 是 `aria-hidden` 的空 div。
- 文章頁 `app/sorting/layout.tsx` 用 `max-w-[96rem]` + `mx-auto`，配合 grid 達到視窗置中。
- 字型：`Fraunces` (serif) 用於所有標題與 Narration 的 title，`Inter` (sans) 用於 body，`font-mono` 用於程式碼與數字。
- Heading / paragraph / list / table / code 的樣式統一由 `mdx-components.tsx` 提供，不要在個別 MDX 檔案裡 inline className。
- 數學公式不用 KaTeX（沒裝 remark-math），用 fenced code block 呈現即可：` ``` T(n) = (n−1) + (n−2) + ... ``` `。

## AlgorithmRunner 互動規則
- **三大互動元件**：`ArrayRenderer`（動畫）/ `CodePanel`（程式碼）/ `Narration`（說明）/ `StepPlayer`（控制）。
- **順序**（上到下）：animation + code（Splitter 分割）→ Narration → StepPlayer。**Narration 必須在動畫正下方**，不要放到 StepPlayer 底下。
- **Layout toggle**：使用者可以切換橫排（side-by-side）/ 直排（stacked）。兩種都支援**拖曳調整比例**（`Splitter` 元件，`orientation` prop 決定拖曳方向）。直排也要能拖曳調整高度。
- **偏好持久化**：`layout`、`splitRatioH`、`splitRatioV` 各自存 `localStorage`（keys: `dsa:runner-layout`、`dsa:runner-split-h`、`dsa:runner-split-v`），讀寫都 try-catch 包起來避免 SSR / private-mode 爆掉。
- **StepPlayer 排版**：Transport 按鈕群（Restart / Prev / Play / Next / End + 步數計數）**水平置中**，Speed 按鈕群推到**最右側**。技巧是左右各放一個 `flex-1` spacer。
- **Speed 選項固定為 `[0.25, 0.5, 1, 2]`**。不要加 4x（太快看不清動畫），需要慢速觀察用 0.25x。
- **手動切 step 自動暫停**：點擊 Prev / Next / Restart / End、拖曳 scrubber、按 `←` / `→` 鍵都會先呼叫 `onPause` 再切 step。Space 鍵維持 play/pause toggle。
- **鍵盤快捷鍵**：`Space` = play/pause、`←` / `→` = prev/next step。聚焦在 input / textarea / contentEditable 時不攔截。

## Content / 筆記規則
每篇演算法筆記固定結構：
1. 一句話定位（是什麼、為什麼存在）
2. `<AlgorithmRunner slug="..." initial={[...]} />`
3. **為什麼會動** — 迴圈不變量、白話解釋
4. **優化 / 變形**（如果有）
5. **複雜度** — 必須包含「怎麼算出來的」的推導，不能只丟 Big-O。例如時間要從 `T(n) = Σ ...` 推到主導項；空間要解釋哪些變數被用到；穩定性要用比較運算子解釋（嚴格 `>` vs `>=`）。
6. **跟其他排序比較**（GFM table）
7. **常見題型** — LeetCode 題號 + 連結

### Category 第一頁的責任：先建立背景、再講變體

當你新增一個 category（sorting / tree / graph / ...）的第一頁時，**不能直接跳進「這個變體怎麼做」**。讀者落地的第一頁要替他建立整個 category 的座標：

1. **這個 category 在解什麼問題？** —— 用一段定義領域問題（例：「動態連通性」「比較式排序」「在二元樹上系統性走訪每個節點」）
2. **核心 API 是什麼？** —— 列出這個資料結構/演算法家族的標準操作（例：UF 的 `union` / `find`、tree 的「走訪」、heap 的 `push` / `pop`）
3. **常見應用情境** —— 讓讀者知道為什麼要學
4. **再進入本頁變體的具體實作**

後續變體頁可以省掉 1–3，直接從變體本身講起；但若有讀者直接從搜尋結果跳進變體頁（不是從第一頁循序走），cross-link 回第一頁的背景說明（例：`[Quick Find](/graph/uf-quick-find#union-find-在解什麼問題)`）。

### 互動 Runner 的 ops/input 必須說明來源

讀者看到動畫時很容易誤以為「演算法自己在挑下一步」。對於吃序列化輸入的演算法（UF 的 ops 序列、graph 的 edge 列表等），第一頁要明說：

- **資料結構是被動的**——序列由呼叫端餵進來，演算法自己不挑
- **MDX 寫死 vs Random vs StepPlayer 的差別**：MDX `props` 是固定測試序列；`Random` 按鈕重新生成；`StepPlayer` 的 Prev/Next 只在已生成的 step 序列裡移動，不改變 ops
- **真實題目對照**：用一個 GFM table 列出真實題目的 ops 來源（LeetCode 547 的雙重迴圈、684 的 edge 陣列、Kruskal 的權重排序），讓讀者把 visualizer 跟現實對接
- **順序影響什麼、不影響什麼**：明確列出（例：UF 順序影響樹形/速度，但不影響最終連通性）

對於變體頁，視 ops 順序對該變體的重要性決定是否再講：
- **順序開始有結構性影響**的變體（例：Quick Union 的鏈狀退化）：要短段提醒，並用對照例子展示「壞順序 vs 好順序」
- **順序影響被吃掉**的變體（例：Weighted 的承諾「不論呼叫端順序都 O(log n)」）：要點出這個承諾，並說明為什麼這頁的 ops 是刻意挑的（示範最佳形狀）
- 後續頁省掉完整解釋，cross-link 回第一頁

### 定義要正向，不要靠「不是 X」來鋪陳

**反模式**：「`parent[i]` 不是 parent，而是 component 代表」——讀者剛進來根本沒有「parent」這個預設，這句話在駁倒一個他沒有的假設，反而種下困惑。

**正面寫法**：先正向定義新概念（「用一個陣列 `id[]`，`id[i]` 直接存 i 所屬 component 的代表」），等到下一個變體真的引入「parent 指標」概念時再點出差異（「這次 `parent[i]` 真的代表 i 的 parent」）。**反向定義只在讀者已經在前一頁建立了該預設時才有意義。**

### 中文修辭：直白優先，避開誇張比喻

- ❌ 不要用「命門」「要害」「殺手鐧」「絕招」這類武俠/中醫味的詞
- ❌ 不要用「核武」「神器」「黑魔法」這類誇張比喻
- ✅ 直白詞彙就好：「主要瓶頸」「關鍵痛點」「為什麼 X 慢」「最壞情況」「決定性的差異」

筆記面向是技術讀者，不是文案。比喻只在能讓概念更清楚時才用（例：「像剝洋蔥」「像水位線」），不為修辭而修辭。

## 測試
- **每個演算法**至少要有：空陣列 / 單一元素 / 已排序 / 反向 / 重複值 / 大量 random input 對比 `Array.prototype.sort` 的測試
- **每個 `xxxSortSteps`** 也要測：multiset invariant（每個 step 的值集合不變）、final step 的值序列要等於 `xxxSort` 的結果、item id 在整個 steps 序列中保持穩定
- 指令：`pnpm test`（一次性）/ `pnpm test:watch`（watch 模式）

## 重要反模式（不要做）
- 不要用 index 當 React key，永遠用 stable id
- 不要在 ArrayRenderer 裡讓 pointer 跟 element 共用同一個父容器 — pointer 必須在獨立 row 才能避免重疊問題
- 不要把 Shiki 匯入到 client component — 只在 server / build time 跑
- 不要在 MDX 裡寫 inline style 或 inline Tailwind 給標題 / 段落 — 這些應該在 `mdx-components.tsx` 統一
- 不要硬寫色碼 — 一律走 `@theme` 定義的 token
- 不要忘記配合 Turbopack 的 string-form plugin 設定（`remarkPlugins: ["remark-gfm"]`，不是 `[remarkGfm]`）
- 不要在 category 第一頁直接跳進變體實作 — 必須先建立「這個 category 在解什麼問題 / 核心 API / 應用場景」的背景
- 不要假設讀者知道「資料結構是被動的」這件事 — 對於吃 ops 序列的演算法（UF、graph）必須明說序列由呼叫端餵、Random/Reset/StepPlayer 各自做什麼、對應真實題目從哪取得序列
- 不要用反向定義（「X 不是 Y 而是 Z」）當引入手段 — 只在讀者已經在前頁建立 Y 的預設時才寫
- 不要用武俠/中醫/誇張比喻（命門、要害、核武、神器…） — 用直白詞彙
