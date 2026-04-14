const clientInput = document.getElementById('client');
const subInput = document.getElementById('sub');
const tieToggle = document.getElementById('tieToggle');
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const resultSection = document.getElementById('resultSection');
const outFolder = document.getElementById('outFolder');
const variantStack = document.getElementById('variantStack');
const listLabel = document.getElementById('listLabel');

const VARIANTS = ["No Sponsor", "Main Sponsor", "All Sponsor", "EFM"];

function initSuggestions() {
    const saved = JSON.parse(localStorage.getItem('mimic_clients') || '[]');
    const list = document.getElementById('client-list');
    list.innerHTML = '';
    saved.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        list.appendChild(opt);
    });
}

function saveClient(name) {
    let saved = JSON.parse(localStorage.getItem('mimic_clients') || '[]');
    if (name && !saved.includes(name)) {
        saved.push(name);
        localStorage.setItem('mimic_clients', JSON.stringify(saved));
        initSuggestions();
    }
}

function toTitleCase(str) {
    return str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function copyToClipboard(text, el) {
    navigator.clipboard.writeText(text);
    const original = el.innerHTML;
    el.innerHTML = `<span style="color:var(--accent)">COPIED!</span>`;
    setTimeout(() => el.innerHTML = original, 700);
}

function process() {
    const file = fileInput.files[0];
    const clientRaw = clientInput.value.trim();
    const subRaw = subInput.value.trim();

    if (!file || !clientRaw) return;

    const client = toTitleCase(clientRaw);
    const sub = subRaw ? toTitleCase(subRaw) : "";
    saveClient(client);

    // 1. Folder Name
    const folderName = sub ? `${client} - ${sub}` : client;
    outFolder.innerText = folderName;
    outFolder.onclick = () => copyToClipboard(folderName, outFolder);

    // 2. File Name Logic
    const ext = file.name.split('.').pop();
    const cleanBase = toTitleCase(file.name.substring(0, file.name.lastIndexOf('.')).replace(/[_-]/g, ' '));
    
    variantStack.innerHTML = ''; // Clear

    if (tieToggle.checked) {
        listLabel.innerText = "File Name Variants (Click to Copy)";
        VARIANTS.forEach(v => {
            const fileName = sub ? 
                `${client} - ${sub} - ${cleanBase} (${v}).${ext}` : 
                `${client} - ${cleanBase} (${v}).${ext}`;

            addResultBox(fileName, v);
        });
    } else {
        listLabel.innerText = "Standard File Name (Click to Copy)";
        const fileName = sub ? 
            `${client} - ${sub} - ${cleanBase}.${ext}` : 
            `${client} - ${cleanBase}.${ext}`;
        addResultBox(fileName, null);
    }

    resultSection.style.display = 'block';
}

function addResultBox(text, variant) {
    const box = document.createElement('div');
    box.className = 'name-box';
    const badge = variant ? `<span class="badge">${variant}</span>` : '';
    box.innerHTML = `<span>${badge}${text}</span>`;
    box.onclick = () => copyToClipboard(text, box);
    variantStack.appendChild(box);
}

// Listeners
dropZone.onclick = () => fileInput.click();
fileInput.onchange = process;
clientInput.oninput = process;
subInput.oninput = process;
tieToggle.onchange = process;

initSuggestions();