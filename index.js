const upload = document.getElementById('upload');
const fileLabel = document.getElementById('fileLabel');
const dropZone = document.getElementById('dropZone');
const previewGrid = document.getElementById('previewGrid');
const btn = document.getElementById('runBtn');
const status = document.getElementById('status');
const sizeLimitInput = document.getElementById('sizeLimit');

/**
 * UI INTERACTION
 */

upload.addEventListener('change', () => {
    const files = Array.from(upload.files);
    previewGrid.innerHTML = ''; // Clear old previews

    if (files.length > 0) {
        fileLabel.innerText = `${files.length} ${files.length === 1 ? 'image' : 'images'} selected`;
        fileLabel.style.color = 'var(--accent)';

        // Build Preview Grid
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const div = document.createElement('div');
                div.className = 'preview-item';
                div.innerHTML = `<img src="${e.target.result}">`;
                previewGrid.appendChild(div);
            };
            reader.readAsDataURL(file);
        });
    } else {
        fileLabel.innerText = "Drop images or click to browse";
        fileLabel.style.color = 'var(--text-dim)';
    }
});

// Drag Effects
['dragenter', 'dragover'].forEach(name => {
    dropZone.addEventListener(name, (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
});
['dragleave', 'drop'].forEach(name => {
    dropZone.addEventListener(name, (e) => { e.preventDefault(); dropZone.classList.remove('drag-over'); });
});

/**
 * CORE PROCESSING logic
 */

btn.addEventListener('click', async () => {
    const files = Array.from(upload.files);
    if (files.length === 0) return alert("No images selected.");

    const userLimitKB = parseInt(sizeLimitInput.value) || 100;
    const targetBytes = userLimitKB * 1024;

    btn.disabled = true;
    btn.innerText = "Compressing...";
    const zip = new JSZip();
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        status.innerText = `Processing: ${file.name}`;
        
        try {
            const img = await loadImage(file);
            const dims = calculateWhatsAppSize(img.width, img.height);
            
            // Smart iterative compression
            const compressedBlob = await smartCompress(img, dims.w, dims.h, targetBytes);
            
            const rawName = file.name.substring(0, file.name.lastIndexOf('.')) || 'image';
            zip.file(`${rawName}_mimic.jpg`, compressedBlob);
            
            URL.revokeObjectURL(img.src); // Memory cleanup
            status.innerText = `OK: ${file.name} (${(compressedBlob.size / 1024).toFixed(1)}KB)`;
        } catch (err) {
            status.innerText = `Fail: ${file.name}`;
            console.error(err);
        }
    }

    status.innerText = "Finalizing ZIP...";
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(zipBlob);
    link.download = `mimic_export_${userLimitKB}kb.zip`;
    link.click();

    btn.disabled = false;
    btn.innerText = "Run Batch Process";
    status.innerText = `Done! Exported ${files.length} images.`;
});

async function smartCompress(img, w, h, target) {
    let q = 0.8; 
    let blob = await canvasToBlob(img, w, h, q);

    // Iteratively drop quality if file is too heavy
    while (blob.size > target && q > 0.1) {
        q -= 0.1;
        blob = await canvasToBlob(img, w, h, q);
    }

    // Force resolution drop if quality reduction isn't enough
    if (blob.size > target) {
        blob = await canvasToBlob(img, w * 0.7, h * 0.7, 0.5);
    }

    return blob;
}

/**
 * HELPERS
 */

function canvasToBlob(img, w, h, q) {
    return new Promise((res) => {
        const cvs = document.createElement('canvas');
        cvs.width = w; cvs.height = h;
        const ctx = cvs.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, w, h);
        cvs.toBlob((b) => res(b), 'image/jpeg', q);
    });
}

function loadImage(file) {
    return new Promise((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = rej;
        i.src = URL.createObjectURL(file);
    });
}

function calculateWhatsAppSize(w, h) {
    const MAX = 1600; 
    let tw = w, th = h;
    if (w > h && w > MAX) { th *= MAX / w; tw = MAX; }
    else if (h > MAX) { tw *= MAX / h; th = MAX; }
    return { w: tw, h: th };
}