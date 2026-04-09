const fileInput = document.getElementById('files');
const btn = document.getElementById('startBtn');
const status = document.getElementById('status');

btn.addEventListener('click', async () => {
    const files = Array.from(fileInput.files);
    
    if (files.length === 0) {
        alert("Please select some images first!");
        return;
    }

    btn.disabled = true;
    const zip = new JSZip();
    
    // Sort files alphabetically first so "1" matches "Image A" consistently
    files.sort((a, b) => a.name.localeCompare(b.name, undefined, {numeric: true, sensitivity: 'base'}));

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const extension = file.name.split('.').pop();
        
        // New name is just the index + 1
        const newName = `${i + 1}.${extension}`;
        
        status.innerText = `Processing: ${newName}`;
        zip.file(newName, file);
    }

    status.innerText = "Generating ZIP...";
    const content = await zip.generateAsync({ type: "blob" });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = "numbered_images.zip";
    link.click();

    status.innerText = "Done!";
    btn.disabled = false;
});