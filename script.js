function cleanConversation(rawText, userName = "用户", assistantName = "AI") {
  let cleaned = rawText
    .replace(/\|\|.*?\|\|/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/<\|.*?\|>/g, '')
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

function handleCleanAndPack() {
  const files = document.getElementById("fileInput").files;
  const userName = document.getElementById("userNameInput").value.trim() || "用户";
  const assistantName = document.getElementById("assistantNameInput").value.trim() || "AI";

  if (files.length === 0) {
    alert("请选择至少一个文件");
    return;
  }

  const zip = new JSZip();
  const outputArea = document.getElementById("outputArea");
  outputArea.innerHTML = "";

  let completed = 0;

  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawText = e.target.result;
      const cleaned = cleanConversation(rawText, userName, assistantName);
      const filename = `恋人对话-${file.name.replace(/\.[^/.]+$/, "")}.txt`;
      zip.file(filename, cleaned);
      completed++;

      if (completed === files.length) {
        zip.generateAsync({ type: "blob" }).then(blob => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
          a.href = url;
          a.download = `恋爱对话合集-${timestamp}.zip`;
          a.textContent = `点击下载 恋爱对话合集-${timestamp}.zip`;
          a.style.display = 'block';
          a.style.marginTop = '20px';
          a.style.padding = '10px 20px';
          a.style.backgroundColor = '#6200EE';
          a.style.color = 'white';
          a.style.borderRadius = '5px';
          a.style.textDecoration = 'none';
          a.style.cursor = 'pointer';

          outputArea.innerHTML = '';
          outputArea.appendChild(a);
          a.onclick = () => {
            setTimeout(() => URL.revokeObjectURL(url), 100);
          };
        });
      }
    };
    reader.readAsText(file);
  });
}
