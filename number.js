const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const execBtn = document.getElementById('execBtn');
const status = document.getElementById('status');

// Handle Drag & Drop
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(e => {
    dropZone.addEventListener(e, (evt) => {
        evt.preventDefault();
        evt.stopPropagation();
    }, false);
});

dropZone.addEventListener('drop', (e) => {
    handleFiles(e.dataTransfer.files);
}, false);

dropZone.onclick = () => fileInput.click();
fileInput.onchange = () => handleFiles(fileInput.files);

function handleFiles(files) {
    if (files.length > 0) {
        window.selectedFiles = Array.from(files);
        // Sort alphabetically/numerically so the sequence makes sense
        window.selectedFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, {numeric: true, sensitivity: 'base'}));
        
        document.getElementById('label').innerText = `${files.length} files sequence ready`;
        document.getElementById('label').style.color = 'var(--accent)';
    }
}

execBtn.onclick = async () => {
    const files = window.selectedFiles || [];
    const prefix = document.getElementById('prefix').value.trim();
    let currentNum = parseInt(document.getElementById('startNum').value) || 1;

    if (files.length === 0) return alert("Please select files first.");

    execBtn.disabled = true;
    execBtn.innerText = "Bundling ZIP...";
    status.style.display = 'block';
    status.innerText = "Generating sequence names...";

    const zip = new JSZip();

    for (let file of files) {
        try {
            const ext = file.name.split('.').pop();
            // 3-digit padding (001, 002) for clean sorting
            const paddedNum = currentNum.toString().padStart(3, '0');
            const newName = `${prefix}${paddedNum}.${ext}`;

            // Add to ZIP
            zip.file(newName, file);
            
            status.innerText += `\n→ Added to ZIP: ${newName}`;
            status.scrollTop = status.scrollHeight;

            currentNum++;
        } catch (e) {
            status.innerText += `\n❌ Failed: ${file.name}`;
        }
    }

    status.innerText += "\n\nFinalizing ZIP package...";

    try {
        // We use compression: "STORE" to avoid high RAM usage during zipping
        const content = await zip.generateAsync({
            type: "blob",
            compression: "STORE" 
        });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `${prefix || 'Sequence'}_Batch.zip`;
        link.click();
        
        status.innerText += "\n\nSuccess! ZIP Downloaded.";
    } catch (err) {
        status.innerHTML = `<span style="color:#ff4444">Error: Batch too large for browser ZIP memory.</span>`;
    }

    execBtn.disabled = false;
    execBtn.innerText = "Rename & Download ZIP";
};