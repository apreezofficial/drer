/**
 * AuraAI — Renderer Process
 * Handles UI state, markdown rendering, and IPC communication.
 */

/* ---- Elements ------------------------------------------------------------ */

const viewMain     = document.getElementById('view-main');
const viewSettings = document.getElementById('view-settings');

const screenshotImg         = document.getElementById('screenshot-img');
const screenshotPlaceholder = document.getElementById('screenshot-placeholder');
const questionInput         = document.getElementById('question-input');
const btnSend               = document.getElementById('btn-send');
const btnClose              = document.getElementById('btn-close');
const btnSettings           = document.getElementById('btn-settings');
const btnSettingsBack       = document.getElementById('btn-settings-back');
const loadingEl             = document.getElementById('loading');
const responseContent       = document.getElementById('response-content');
const emptyState            = document.getElementById('empty-state');
const footerMeta            = document.getElementById('footer-meta');

const keyInput    = document.getElementById('key-input');
const btnToggleKey = document.getElementById('btn-toggle-key');
const btnSaveKey  = document.getElementById('btn-save-key');
const keyStatus   = document.getElementById('key-status');

/* ---- View switching ------------------------------------------------------ */

function showView(name) {
  viewMain.classList.toggle('active', name === 'main');
  viewSettings.classList.toggle('active', name === 'settings');
}

btnSettings.addEventListener('click', () => {
  loadKeyIntoSettings();
  showView('settings');
});

btnSettingsBack.addEventListener('click', () => showView('main'));
btnClose.addEventListener('click', () => window.aura.hide());

/* ---- External links ------------------------------------------------------ */

document.querySelectorAll('a[href]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    // In Electron renderer we can't use shell directly — send to main via IPC
    // For simplicity, open in default browser via window.open
    window.open(a.href, '_blank');
  });
});

/* ---- Settings ------------------------------------------------------------ */

async function loadKeyIntoSettings() {
  try {
    const { groqApiKey } = await window.aura.getKey();
    keyInput.value = groqApiKey || '';
  } catch {}
}

btnToggleKey.addEventListener('click', () => {
  keyInput.type = keyInput.type === 'password' ? 'text' : 'password';
});

btnSaveKey.addEventListener('click', async () => {
  const key = keyInput.value.trim();
  if (!key) {
    keyStatus.textContent = 'Please enter a key.';
    keyStatus.className = 'setting-status err';
    return;
  }
  try {
    await window.aura.setConfig({ groqApiKey: key });
    keyStatus.textContent = '✓ Key saved.';
    keyStatus.className = 'setting-status ok';
    setTimeout(() => { keyStatus.textContent = ''; }, 3000);
  } catch (e) {
    keyStatus.textContent = 'Failed to save.';
    keyStatus.className = 'setting-status err';
  }
});

/* ---- Query submission ---------------------------------------------------- */

async function submitQuery() {
  const question = questionInput.value.trim();
  await window.aura.query(question || null);
}

btnSend.addEventListener('click', submitQuery);

questionInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    submitQuery();
  }
});

/* ---- IPC: loading state -------------------------------------------------- */

window.aura.on('ai:loading', ({ question }) => {
  showView('main');
  loadingEl.style.display    = 'flex';
  emptyState.style.display   = 'none';
  responseContent.innerHTML  = '';
  footerMeta.textContent     = 'Analysing with Groq Vision...';

  if (question) {
    questionInput.value = question;
  }
});

/* ---- IPC: result --------------------------------------------------------- */

window.aura.on('ai:result', ({ success, text, screenshot, model, tokens }) => {
  loadingEl.style.display = 'none';

  // Show screenshot
  if (screenshot) {
    screenshotImg.src = screenshot;
    screenshotImg.classList.add('visible');
    screenshotPlaceholder.classList.add('hidden');
  }

  // Render response
  emptyState.style.display  = 'none';
  responseContent.innerHTML = renderMarkdown(text || '');

  // Add copy buttons to code blocks
  responseContent.querySelectorAll('pre').forEach(pre => {
    const btn = document.createElement('button');
    btn.className   = 'copy-btn';
    btn.textContent = 'Copy';
    btn.addEventListener('click', () => {
      const code = pre.querySelector('code');
      navigator.clipboard.writeText(code ? code.textContent : pre.textContent);
      btn.textContent = 'Copied!';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = 'Copy';
        btn.classList.remove('copied');
      }, 2000);
    });
    pre.style.position = 'relative';
    pre.appendChild(btn);
  });

  // Footer meta
  if (success) {
    footerMeta.textContent = tokens
      ? `${tokens} tokens · ${model || 'Groq Vision'}`
      : 'Done';
  } else {
    footerMeta.textContent = 'Error — check your API key in Settings';
  }
});

/* ---- IPC: navigate to settings ------------------------------------------ */

window.aura.on('nav:settings', () => {
  loadKeyIntoSettings();
  showView('settings');
});

/* ---- Markdown renderer --------------------------------------------------- */
/*
 * Lightweight markdown → HTML converter.
 * Handles: code blocks, inline code, headers, bold, italic, lists, paragraphs.
 * No external dependency needed.
 */

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderMarkdown(md) {
  let html = '';
  const lines = md.split('\n');
  let i = 0;
  let inList = false;

  const closeList = () => {
    if (inList) { html += '</ul>'; inList = false; }
  };

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.startsWith('```')) {
      closeList();
      const lang = line.slice(3).trim();
      let code = '';
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        code += escapeHtml(lines[i]) + '\n';
        i++;
      }
      html += `<pre><code class="lang-${escapeHtml(lang)}">${code}</code></pre>`;
      i++;
      continue;
    }

    // Headings
    const hMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (hMatch) {
      closeList();
      const level = hMatch[1].length;
      html += `<h${level}>${inlineMarkdown(hMatch[2])}</h${level}>`;
      i++; continue;
    }

    // Unordered list
    const liMatch = line.match(/^[-*+]\s+(.+)/);
    if (liMatch) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += `<li>${inlineMarkdown(liMatch[1])}</li>`;
      i++; continue;
    }

    // Blank line
    if (line.trim() === '') {
      closeList();
      i++; continue;
    }

    // Paragraph
    closeList();
    html += `<p>${inlineMarkdown(line)}</p>`;
    i++;
  }

  closeList();
  return html;
}

function inlineMarkdown(str) {
  return escapeHtml(str)
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

/* ---- Keyboard shortcuts -------------------------------------------------- */

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') window.aura.hide();
});
