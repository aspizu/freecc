// ==UserScript==
// @name        FreeCC
// @namespace   Violentmonkey Scripts
// @match       https://claude.ai/*
// @icon        https://claude.ai/favicon.ico
// @grant       none
// @version     1.0
// @author      -
// @description FreeCC turns Claude Web into Claude Code
// ==/UserScript==

// @ts-check

async function getLastClaudeMessage() {
  const lastMessage = [
    ...document.querySelectorAll(
      '[data-is-streaming="false"] > .font-claude-response',
    ),
  ].at(-1)?.parentNode?.parentNode?.parentNode;
  /** @type {HTMLButtonElement | null | undefined} */
  const copyButton = lastMessage?.querySelector(
    '[data-testid="action-bar-copy"]',
  );
  if (!copyButton) return null;
  copyButton.click();
  await new Promise((resolve) => setTimeout(resolve, 250));
  return await navigator.clipboard.readText();
}

/** @type {string | null} */
let lastMsg = null;
/** @type {ReturnType<typeof setInterval> | null} */
let intervalId = null;
/** @type {boolean} */
let isRunning = false;

function startSession() {
  intervalId = setInterval(async () => {
    const msg = await getLastClaudeMessage();
    if (msg && msg != lastMsg) {
      onMessage(msg);
    }
    lastMsg = msg;
  }, 5000);
  isRunning = true;
  updateButton();
}

function stopSession() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  isRunning = false;
  updateButton();
}

function updateButton() {
  const btn = document.getElementById("freecc-init");
  if (!btn) return;
  btn.classList.toggle("running", isRunning);
}

/**
 * @param {string} text
 * @param {boolean} send
 */
async function sendMsg(text, send = true) {
  /** @type {HTMLDivElement | null} */
  const chatbox = document.querySelector('[data-testid="chat-input"]');
  if (!chatbox) {
    console.error("[FreeCC]: failed to send message, chatbox not found.");
    return;
  }
  chatbox.focus();
  document.execCommand("insertText", false, text);
  if (send) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    /** @type {HTMLButtonElement | null} */
    const sendButton = document.querySelector('[aria-label="Send message"]');
    if (!sendButton) {
      console.error("[FreeCC]: failed to send message, send button not found.");
      return;
    }
    sendButton.click();
  }
}

/** @param {string} msg  */
async function onMessage(msg) {
  const res = await fetch("http://localhost:3000/tool", {
    method: "POST",
    body: msg,
  });

  if (!res.ok) {
    console.error(
      "[FreeCC]: failed to call tool: ",
      res.status,
      res.statusText,
    );
    return;
  }

  const response = await res.json();

  if (response.skipped) {
    return;
  }

  await sendMsg(response.msg);
}

const div = document.createElement("div");
document.body.append(div);

div.innerHTML = `
<style>
  #freecc-toolbar {
    position: fixed;
    z-index: 99999999;
    bottom: 0;
    right: 0;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 6px;
    background: rgba(15, 15, 15, 0.85);
    backdrop-filter: blur(8px);
    border-top-left-radius: 8px;
    border: 1px solid rgba(255,255,255,0.08);
    border-right: none;
    border-bottom: none;
    font-family: monospace;
  }

  #freecc-init {
    position: relative;
    width: 44px;
    height: 22px;
    padding: 0;
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 11px;
    cursor: pointer;
    letter-spacing: 0.03em;
    transition: background 0.2s;
    &::after {
      content: "";
      position: absolute;
      top: 2px;
      left: 2px;
      width: 16px;
      height: 16px;
      background: #888;
      border-radius: 50%;
      transition: transform 0.2s, background 0.2s;
    }
    &.running {
      background: #22c55e;
      &::after {
        transform: translateX(22px);
        background: #fff;
      }
    }
  }
</style>
<div id="freecc-toolbar">
  <button id="freecc-init" title="Toggle FreeCC session"></button>
</div>
`;

document.getElementById("freecc-init")?.addEventListener("click", async () => {
  if (isRunning) {
    stopSession();
  } else {
    const response = await fetch("http://localhost:3000/init");
    const prompt = await response.text();
    await sendMsg(prompt, /* send */ false);
    startSession();
  }
});
