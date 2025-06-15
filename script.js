function cleanConversation(rawText, userName = "用户", assistantName = "AI") {
  let cleaned = rawText
    .replace(/\|\|.*?\|\|/g, '') 
    .replace(/\[.*?\]/g, '') 
    .replace(/\n{2,}/g, '\n') 
    .trim();

  const lines = cleaned.split('\n').filter(line => line.trim() !== '');
  const output = [];

  let lastSpeaker = null;

  lines.forEach(line => {
    let speaker = null;
    let content = line.trim();

    if (content.startsWith(`${userName}：`) || content.startsWith(`${userName}:`)) {
      speaker = userName;
      content = content.replace(`${userName}：`, '').replace(`${userName}:`, '').trim();
    } else if (content.startsWith(`${assistantName}：`) || content.startsWith(`${assistantName}:`)) {
      speaker = assistantName;
      content = content.replace(`${assistantName}：`, '').replace(`${assistantName}:`, '').trim();
    } else {
      speaker = lastSpeaker || assistantName;
    }

    output.push(`${speaker}：${content}`);
    lastSpeaker = speaker;
  });

  return output.join('\n').trim();
}

function addToZip(filename, content) {
  const finalFilename = `恋人对话-${filename}`;
  return { filename: finalFilename, content };
}

function handleCleanAndPack() {
  const fileInput = document.getElementById("fileInput");
  const userName = document.getElementById("userNameInput").value.trim() || "用户";
  const assistantName = document.getElementById("assistantNameInput").value.trim() || "AI";

  const files = Array.from(fileInput.files);
  if (!files.length) {
    alert("请选择文件！");
    return;
  }

  const zip = new JSZip();
  let processedCount = 0;

  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = function (e) {
      const rawText = e.target.result;
      const cleaned = cleanConversation(rawText, userName, assistantName);
      const cleanedItem = addToZip(file.name, cleaned);
      zip.file(cleanedItem.filename, cleanedItem.content);

      processedCount++;
      if (processedCount === files.length) {
        zip.generateAsync({ type: "blob" }).then(blob => {
          createDownloadLink(blob, "恋人对话合集.zip");
        });
      }
    };
    reader.readAsText(file);
  });
}

function createDownloadLink(blob, zipName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = zipName;
  a.textContent = `点击下载 ${zipName}`;
  a.style.display = 'inline-block';
  a.style.marginTop = '20px';
  a.style.padding = '10px 20px';
  a.style.backgroundColor = '#6200EE';
  a.style.color = 'white';
  a.style.borderRadius = '5px';
  a.style.textDecoration = 'none';
  a.style.cursor = 'pointer';

  const outputArea = document.getElementById("outputArea");
  outputArea.innerHTML = '';
  outputArea.appendChild(a);

  a.onclick = () => {
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };
}
