// ==UserScript==
// @name         FreeCC
// @namespace    https://github.com/aspizu/freecc
// @match        https://claude.ai/*
// @icon         https://claude.ai/favicon.ico
// @grant        none
// @license      MIT
// @version      1.1
// @description  Turn Claude Web into Claude Code
// @author       Priyanshu Dangare <hello@aspiz.uk>
// ==/UserScript==

// @ts-check

/** @param {number} ms @returns {Promise<void>} */
async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

/** @param {string} message @returns {never} */
function panic(message) {
    throw new Error(`panic: ${message}`)
}

/**
 * @template T
 * @param {T|null|undefined} value @returns {T}
 */
function unwrap(value) {
    if (value == null) panic(`unwrap() called on null/undefined`)
    return value
}

async function getLastClaudeMessage() {
    const div = [
        ...document.querySelectorAll(
            '[data-is-streaming="false"] > .font-claude-response',
        ),
    ].at(-1)?.parentElement?.parentElement?.parentElement
    if (!div) return null
    /** @type {HTMLButtonElement|null} */
    const copyButton = div.querySelector('[data-testid="action-bar-copy"]')
    if (!copyButton) return null
    copyButton.click()
    await sleep(500)
    return await navigator.clipboard.readText()
}

/** @param {string} message */
async function insertTextIntoClaude(message) {
    /** @type {HTMLDivElement|null} */
    const div = document.querySelector('[data-testid="chat-input"]')
    if (!div) panic("chat input not found")
    div.focus()
    document.execCommand("insertText", false, message)
}

/** @param {string} message */
async function sendMessageToClaude(message) {
    await insertTextIntoClaude(message)
    await sleep(500)
    /** @type {HTMLButtonElement|null} */
    const sendButton = document.querySelector('[aria-label="Send message"]')
    if (!sendButton) panic("send button not found")
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

async function startSession() {
    if (running) {
        console.error("[freecc]: Session already running")
        return
    }

    btn.disabled = true
    btn.textContent = "injecting…"

    const prompt = await getSystemPrompt()
    if (prompt) {
        await insertTextIntoClaude(prompt)
    }

    running = true
    interval = setInterval(poll, 2000)
    btn.disabled = false
    btn.textContent = "stop"
    btn.classList.add("stop")
    dot.classList.remove("receiving")
    dot.classList.add("on")
}

function stopSession() {
    if (interval) {
        clearInterval(interval)
        interval = null
    }
    running = false
    setReceiving(false)
    dot.classList.remove("on")
    btn.textContent = "start"
    btn.classList.remove("stop")
}

async function poll() {
    const message = await getLastClaudeMessage()
    if (message === lastMessage) return
    lastMessage = message
    if (!message) return
    const response = await getMessageResponse(message)
    if (!response) {
        stopSession()
        return
    }
    await sendMessageToClaude(response)
}

const container = document.createElement("div")
container.innerHTML = `
<style>
    #freecc {
        position: fixed;
        bottom: 16px;
        left: 16px;
        z-index: 9999;
        display: inline-flex;
        align-items: stretch;
        background: #1a1a1a;
        border: 1px solid #333;
        font-family: anthropicMono;
        font-size: 11px;
        line-height: 1;
    }
    .freecc-seg {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 8px;
        border-right: 1px solid #333;
    }
    .freecc-seg:last-child { border-right: none; }
    #freecc-dot {
        width: 7px;
        height: 7px;
        flex-shrink: 0;
        background: #333;
    }
    #freecc-dot.on {
        background: #4ade80;
    }
    #freecc-dot.receiving {
        background: transparent;
        border: 1.5px solid #facc15;
        border-top-color: transparent;
        border-radius: 50%;
        animation: freecc-spin 0.7s linear infinite;
    }
    @keyframes freecc-spin { to { transform: rotate(360deg); } }
    #freecc-label {
        color: #555;
        letter-spacing: 0.05em;
    }
    #freecc-btn {
        background: none;
        border: none;
        padding: 0;
        margin: 0;
        font-family: inherit;
        font-size: 11px;
        color: #999;
        cursor: pointer;
        letter-spacing: 0.03em;
    }
    #freecc-btn:hover:not(:disabled) { color: #fff; }
    #freecc-btn:disabled { color: #555; cursor: default; }
    #freecc-btn.stop { color: #f87171; }
</style>
<div id="freecc">
    <div class="freecc-seg">
        <div id="freecc-dot"></div>
        <span id="freecc-label">freecc</span>
    </div>
    <div class="freecc-seg">
        <button id="freecc-btn">start</button>
    </div>
</div>`

document.body.appendChild(container)

const btn = unwrap(
    /** @type {HTMLButtonElement|null} */ (document.querySelector("#freecc-btn")),
)
const dot = unwrap(document.querySelector("#freecc-dot"))

/** @param {boolean} active */
function setReceiving(active) {
    if (active) {
        dot.classList.add("receiving")
        dot.classList.remove("on")
    } else {
        dot.classList.remove("receiving")
        if (running) dot.classList.add("on")
    }
}

btn.addEventListener("click", () => {
    if (running) stopSession()
    else startSession()
})
