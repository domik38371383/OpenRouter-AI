console.log('%c STOP! IF YOU WANT GET FREE API KEY GO HERE: https://openrouter.ai/settings/keys', 'font-size: 70px; color: crimson; font-weight: bold;');
const chatContainer = document.getElementById('chat-container');
const chatWindow = document.getElementById('chat-window');
const inputForm = document.getElementById('input-form');
const inputMessage = document.getElementById('input-message');

const API_KEY = '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';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

function updateLayout() {
    const messages = chatWindow.querySelectorAll('.message');
    let widestMessageWidth = 0;

    messages.forEach(msg => {
        if (msg.scrollWidth > widestMessageWidth) {
            widestMessageWidth = msg.scrollWidth;
        }
    });

    const targetContainerWidth = widestMessageWidth + 60;
    const minWidth = 400;
    const maxWidth = window.innerWidth * 0.95;

    let newWidth = Math.max(minWidth, targetContainerWidth);
    newWidth = Math.min(newWidth, maxWidth);

    chatContainer.style.width = `${newWidth}px`;

    if (widestMessageWidth > chatWindow.clientWidth) {
        chatWindow.classList.add('scrolling');
    } else {
        chatWindow.classList.remove('scrolling');
    }
}

function appendMessage(text, sender) {
    const messageEl = document.createElement('div');
    messageEl.classList.add('message', sender === 'user' ? 'user-message' : 'bot-message');
    messageEl.style.width = '100px';
    messageEl.textContent = text;
    chatWindow.appendChild(messageEl);

    requestAnimationFrame(() => {
        messageEl.style.width = '';
        updateLayout();
        chatWindow.scrollTop = chatWindow.scrollHeight;
    });

    return messageEl;
}

async function typeBotReply(text) {
    const messageEl = document.createElement('div');
    messageEl.classList.add('message', 'bot-message');
    chatWindow.appendChild(messageEl);

    for (let i = 0; i < text.length; i++) {
        messageEl.textContent += text.charAt(i);
        updateLayout();
        chatWindow.scrollTop = chatWindow.scrollHeight;
        await new Promise(resolve => setTimeout(resolve, 5));
    }
}

function showThinking() {
    const thinkingEl = document.createElement('div');
    thinkingEl.classList.add('message', 'bot-message');
    thinkingEl.id = 'thinking-indicator';
    thinkingEl.textContent = 'Myśli';
    chatWindow.appendChild(thinkingEl);
    chatWindow.scrollTop = chatWindow.scrollHeight;

    let dots = 0;
    const intervalId = setInterval(() => {
        dots = (dots + 1) % 4;
        thinkingEl.textContent = 'Thinking' + '.'.repeat(dots);
    }, 400);

    return { element: thinkingEl, intervalId };
}

function removeThinking(thinking) {
    if (thinking && thinking.element) {
        clearInterval(thinking.intervalId);
        thinking.element.textContent = 'Loading...';
    }
}

async function sendMessage(message) {
    appendMessage(message, 'user');

    const thinking = showThinking();

    const payload = {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: message }]
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        removeThinking(thinking);

        if (!response.ok) {
            throw new Error(`Błąd sieci: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (thinking && thinking.element) {
            thinking.element.remove();
        }

        const botReply = data.choices?.[0]?.message?.content?.trim() || "Przepraszam, nie udało mi się uzyskać odpowiedzi.";
        await typeBotReply(botReply);

    } catch (error) {
        console.error("Error:", error);
        removeThinking(thinking);
        if (thinking && thinking.element) {
            thinking.element.remove();
        }
        appendMessage(`Error: ${error.message}`, 'bot');
    }
}

inputForm.addEventListener('submit', e => {
    e.preventDefault();
    const message = inputMessage.value.trim();
    if (!message) return;
    inputMessage.value = '';
    sendMessage(message);
});
