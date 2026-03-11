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
setInterval(async () => {
  const msg = await getLastClaudeMessage();
  if (msg && msg != lastMsg) {
    onMessage(msg);
  }
  lastMsg = msg;
}, 5000);

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
    font-family: monospace;
  }

  #freecc-init {
    padding: 8px;
    background-color: red;
    &:hover {
      background-color: green;
    }
  }
</style>
<div id="freecc-toolbar">
  <button id="freecc-init">new FreeCC session</button>
</div>
`;

document.getElementById("freecc-init")?.addEventListener("click", async () => {
  const response = await fetch("http://localhost:3000/init");
  const prompt = await response.text();
  await sendMsg(prompt, /* send */ false);
});
