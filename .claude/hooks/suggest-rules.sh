#!/usr/bin/env bash
# Stop hook: after each Claude Code session, ask Claude itself to review the
# transcript and surface general, reusable rules that would help future sessions
# in this repo. Suggestions are appended to .claude/suggested-rules.md (which is
# gitignored) — never written directly into CLAUDE.md. The human reviews and
# merges manually.
#
# Design notes:
# - Always `exit 0` on any failure. Blocking Stop would wedge every session.
# - Honor `stop_hook_active` to prevent recursion: the `claude -p` call this
#   script makes itself fires Stop hooks when it finishes.
# - Budget: truncate transcript to the last ~40 assistant/user messages.

set +e

# --- helpers ------------------------------------------------------------------

log() { echo "[suggest-rules] $*" >&2; }

# --- read hook payload --------------------------------------------------------

payload="$(cat)"
if [[ -z "$payload" ]]; then
  log "no stdin payload — skipping"
  exit 0
fi

if ! command -v jq >/dev/null 2>&1; then
  log "jq not installed — skipping (run: brew install jq)"
  exit 0
fi

if ! command -v claude >/dev/null 2>&1; then
  log "claude CLI not found in PATH — skipping"
  exit 0
fi

stop_hook_active="$(printf '%s' "$payload" | jq -r '.stop_hook_active // false')"
if [[ "$stop_hook_active" == "true" ]]; then
  log "stop_hook_active=true — exiting to avoid recursion"
  exit 0
fi

transcript_path="$(printf '%s' "$payload" | jq -r '.transcript_path // empty')"
session_id="$(printf '%s' "$payload" | jq -r '.session_id // empty')"

if [[ -z "$transcript_path" || ! -f "$transcript_path" ]]; then
  log "no transcript at '$transcript_path' — skipping"
  exit 0
fi

project_dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"
claude_md="$project_dir/CLAUDE.md"
agents_md="$project_dir/AGENTS.md"
out_file="$project_dir/.claude/suggested-rules.md"

# --- build prompt -------------------------------------------------------------

# Extract the last ~40 entries, flattened to "role: content" text.
# Transcript is JSONL; each line has { type, message: { role, content } }.
transcript_excerpt="$(
  tail -n 120 "$transcript_path" \
    | jq -rs '
        map(select(.type == "user" or .type == "assistant"))
        | .[-40:]
        | map(
            (.message.role // .type) as $role
            | (
                if (.message.content | type) == "array"
                then
                  .message.content
                  | map(
                      if .type == "text" then .text
                      elif .type == "tool_use" then "[tool_use: " + (.name // "?") + "]"
                      elif .type == "tool_result" then "[tool_result]"
                      else "" end
                    )
                  | join(" ")
                else (.message.content // "")
                end
              ) as $text
            | "\($role): \($text)"
          )
        | join("\n\n")
      ' 2>/dev/null
)"

if [[ -z "$transcript_excerpt" ]]; then
  log "failed to parse transcript — skipping"
  exit 0
fi

claude_md_content=""
[[ -f "$claude_md" ]] && claude_md_content="$(cat "$claude_md")"
agents_md_content=""
[[ -f "$agents_md" ]] && agents_md_content="$(cat "$agents_md")"

meta_prompt="$(cat <<PROMPT
你的任務:閱讀以下 Claude Code session 對話片段,找出「如果加進 CLAUDE.md 會讓未來同類任務更順」的通用規範、反模式或 convention。

嚴格條件:
- 必須是可重用的通用規則,不是這次特定任務的實作細節
- 必須 surprising 或 non-obvious,不是常識(e.g. 不要寫「用 TypeScript」這種廢話)
- 必須能從對話明確推論出來,不可編造
- 不可重複已經存在於 CLAUDE.md / AGENTS.md 的規則
- 每條規則一句話講完,不超過 100 字

輸出格式:
- 若沒有任何值得記錄的規則,只輸出一個單字:NONE
- 若有,每條一行,以 "- " 開頭,不加額外說明、不加標題、不加 markdown 粗體
- 最多輸出 5 條

=== 現有 CLAUDE.md ===
$claude_md_content

=== 現有 AGENTS.md ===
$agents_md_content

=== Session 對話片段(最後 40 則) ===
$transcript_excerpt

=== 你的輸出 ===
PROMPT
)"

# --- call claude --------------------------------------------------------------

suggestions="$(
  printf '%s' "$meta_prompt" \
    | claude -p --output-format text --max-turns 1 2>/dev/null
)"

if [[ -z "$suggestions" ]]; then
  log "claude returned empty — skipping"
  exit 0
fi

# Strip trailing whitespace and normalize.
suggestions="$(printf '%s' "$suggestions" | sed -e 's/[[:space:]]*$//')"

if [[ "$suggestions" == "NONE" || "$suggestions" == *"NONE"* && ${#suggestions} -lt 20 ]]; then
  log "no new rules suggested"
  exit 0
fi

# Keep only lines that start with "- " (drop any preamble).
filtered="$(printf '%s\n' "$suggestions" | grep -E '^- ' || true)"
if [[ -z "$filtered" ]]; then
  log "no bullet-formatted rules in output — skipping"
  exit 0
fi

# --- append to suggested-rules.md --------------------------------------------

timestamp="$(date '+%Y-%m-%d %H:%M')"
short_id="${session_id:0:8}"
count="$(printf '%s\n' "$filtered" | wc -l | tr -d ' ')"

{
  [[ -s "$out_file" ]] && echo ""
  echo "## $timestamp (session $short_id)"
  echo ""
  printf '%s\n' "$filtered"
} >> "$out_file"

log "$count rule(s) appended to $out_file"
exit 0
