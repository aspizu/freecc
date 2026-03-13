// ==UserScript==
// @name         FreeCC
// @namespace    https://github.com/aspizu/freecc
// @match        https://claude.ai/*
// @icon         https://claude.ai/favicon.ico
// @grant        none
// @license      MIT
// @version      1.0
// @description  Turn Claude Web into Claude Code
// @author       Priyanshu Dangare <hello@aspiz.uk>
// ==/UserScript==

// @ts-check

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * @template T
 * @param {T|null|undefined} value
 * @returns {T}
 */
function bang(value) {
    if (value === null || value === undefined) {
        throw new Error("Value is null or undefined")
    }
    return value
}

async function getLastClaudeMessage() {
    const div = [
        ...document.querySelectorAll(
            '[data-is-streaming="false"] > .font-claude-response',
        ),
    ].at(-1)?.parentElement?.parentElement?.parentElement
    if (!div) {
        console.error("[freecc]: Could not find last message")
        return null
    }
    /** @type {HTMLButtonElement|null} */
    const copyButton = div.querySelector('[data-testid="action-bar-copy"]')
    if (!copyButton) {
        console.error("[freecc]: Could not find copy button")
        return null
    }
    copyButton.click()
    await sleep(500)
    return await navigator.clipboard.readText()
}

/**
 * Inserts text into the chat input without sending.
 * @param {string} message
 */
async function insertTextIntoClaude(message) {
    /** @type {HTMLDivElement|null} */
    const div = document.querySelector('[data-testid="chat-input"]')
    if (!div) {
        console.error("[freecc]: Could not find chat input")
        return null
    }
    div.focus()
    document.execCommand("insertText", false, message)
}

/**
 * Inserts text into the chat input and sends it.
 * @param {string} message
 */
async function sendMessageToClaude(message) {
    await insertTextIntoClaude(message)
    await sleep(500)
    /** @type {HTMLButtonElement|null} */
    const sendButton = document.querySelector('[aria-label="Send message"]')
    if (!sendButton) {
        console.error("[freecc]: Could not find send button")
        return null
    }
    sendButton.click()
}

/** @returns {Promise<string|null>} */
async function getSystemPrompt() {
    const res = await fetch("http://localhost:3000/system-prompt")
    if (!res.ok) {
        console.error("[freecc]: Failed to fetch system prompt")
        return null
    }
    return await res.json()
}

/**
 * @param {string} message
 * @returns {Promise<string|null>}
 */
async function getMessageResponse(message) {
    setReceiving(true)
    const res = await fetch("http://localhost:3000/receive-message", {
        method: "POST",
        body: message,
    })
    setReceiving(false)
    if (!res.ok) {
        console.error("[freecc]: Failed to receive message")
        return null
    }
    return await res.json()
}

/** @type {string|null} */
let lastMessage = null

/** @type {boolean} */
let running = false

/** @type {number|null} */
let interval = null

function startSession() {
    if (running) {
        console.error("[freecc]: Session already running")
        return
    }
    running = true
    interval = setInterval(poll, 2000)
    btn.innerText = "Stop"
    btn.classList.add("running")
    status_.classList.add("running")
}

function stopSession() {
    if (interval) {
        clearInterval(interval)
        interval = null
    }
    running = false
    setReceiving(false)
    btn.innerText = "Start"
    btn.classList.remove("running")
    status_.classList.remove("running")
}

async function poll() {
    const message = await getLastClaudeMessage()
    if (message == lastMessage) {
        return
    }
    lastMessage = message
    if (!message) {
        return
    }
    const response = await getMessageResponse(message)
    if (!response) {
        stopSession()
        return
    }
    await sendMessageToClaude(response)
}

/** @type {HTMLDivElement} */
const div = document.createElement("div")

div.innerHTML = `\
<style>
    #freecc-toolbar {
        position: fixed;
        bottom: 16px;
        left: 16px;
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 8px;
        background: #1a1a1a;
        border: 1px solid #2e2e2e;
        border-radius: 8px;
        padding: 6px 10px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    #freecc-status {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #3a3a3a;
        flex-shrink: 0;
        transition: background 0.2s, box-shadow 0.2s;
    }

    #freecc-status.running {
        background: #4ade80;
        box-shadow: 0 0 4px #4ade80;
    }

    #freecc-status.receiving {
        background: transparent;
        border: 2px solid #facc15;
        border-top-color: transparent;
        animation: freecc-spin 0.7s linear infinite;
        box-shadow: none;
    }

    @keyframes freecc-spin {
        to { transform: rotate(360deg); }
    }

    #freecc-label {
        font-size: 11px;
        font-weight: 500;
        color: #888;
        letter-spacing: 0.02em;
        white-space: nowrap;
    }

    .freecc-btn {
        background: #2a2a2a;
        border: 1px solid #3a3a3a;
        border-radius: 5px;
        padding: 3px 8px;
        font-size: 11px;
        font-weight: 500;
        color: #ccc;
        cursor: pointer;
        letter-spacing: 0.02em;
    }

    #freecc-btn.running {
        color: #f87171;
        border-color: #3f2020;
        background: #2a1a1a;
    }

    #freecc-sysprompt-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }
</style>
<div id="freecc-toolbar">
    <div id="freecc-status"></div>
    <span id="freecc-label">FreeCC</span>
    <button id="freecc-sysprompt-btn" class="freecc-btn">System Prompt</button>
    <button id="freecc-btn" class="freecc-btn">Start</button>
</div>`

document.body.appendChild(div)

/** @type {HTMLButtonElement} */
const btn = bang(
    /** @type {HTMLButtonElement|null} */ (document.querySelector("#freecc-btn")),
)
const status_ = bang(document.querySelector("#freecc-status"))
const sysPromptBtn = bang(
    /** @type {HTMLButtonElement|null} */ (
        document.querySelector("#freecc-sysprompt-btn")
    ),
)

/**
 * Toggles the spinning "receiving" state on the status indicator.
 * @param {boolean} active
 */
function setReceiving(active) {
    if (active) {
        status_.classList.add("receiving")
        status_.classList.remove("running")
    } else {
        status_.classList.remove("receiving")
        if (running) status_.classList.add("running")
    }
}

sysPromptBtn.addEventListener("click", async () => {
    sysPromptBtn.disabled = true
    sysPromptBtn.innerText = "Fetching…"
    const prompt = await getSystemPrompt()
    if (prompt) {
        await insertTextIntoClaude(prompt) // insert only, no send
    } else {
        console.error("[freecc]: Could not fetch system prompt")
    }
    sysPromptBtn.innerText = "System Prompt"
    sysPromptBtn.disabled = false
})

btn.addEventListener("click", () => {
    if (running) {
        stopSession()
    } else {
        startSession()
    }
})
