const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const execBtn = document.getElementById('execBtn');
const log = document.getElementById('log');

// --- Drag & Drop Fixes ---
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eName => {
    dropZone.addEventListener(eName, (e) => { e.preventDefault(); e.stopPropagation(); }, false);
});

dropZone.addEventListener('drop', (e) => { handleFiles(e.dataTransfer.files); }, false);
dropZone.onclick = () => fileInput.click();
fileInput.onchange = () => handleFiles(fileInput.files);

function handleFiles(files) {
    if (files.length > 0) {
        window.selectedFiles = Array.from(files);
        document.getElementById('label').innerText = `${files.length} files loaded`;
    }
}

// --- Sequential Individual Downloads ---
execBtn.onclick = async () => {
    const files = window.selectedFiles || [];
    const inFilter = document.getElementById('inputFormat').value;
    const outMime = document.getElementById('outputFormat').value;
    
    if (files.length === 0) return alert("Select files first.");

    const filteredFiles = files.filter(f => {
        if (inFilter === 'all') return f.type.startsWith('image/');
        return f.type.includes(inFilter) || f.name.toLowerCase().endsWith(inFilter === 'jpeg' ? 'jpg' : inFilter);
    });

    execBtn.disabled = true;
    execBtn.innerText = "Processing...";
    log.style.display = 'block';
    log.innerHTML = `<strong>NOTE:</strong> Please click 'Allow' if your browser asks for multiple download permission.`;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    for (let file of filteredFiles) {
        try {
            // Load and draw
            const bitmap = await createImageBitmap(file);
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(bitmap, 0, 0);

            // Convert to Blob
            const blob = await new Promise(resolve => canvas.toBlob(resolve, outMime, 0.9));
            
            // Name formatting
            const newExt = outMime.split('/')[1].replace('jpeg', 'jpg');
            const cleanName = file.name.substring(0, file.name.lastIndexOf('.')) + '.' + newExt;
            
            // --- Direct Download Trigger ---
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = cleanName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Cleanup memory immediately
            URL.revokeObjectURL(link.href);
            bitmap.close(); 
            
            log.innerText += `\n✔ Downloaded: ${cleanName}`;
            log.scrollTop = log.scrollHeight;

            // Short delay to prevent browser from thinking it's a spam attack
            await new Promise(r => setTimeout(r, 150));
            
        } catch (e) {
            log.innerText += `\n❌ Failed: ${file.name}`;
        }
    }

    execBtn.disabled = false;
    execBtn.innerText = "Start Transformation";
    log.innerText += "\n\nAll files processed!";
};