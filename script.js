function cleanConversation(rawText, userName = "用户", assistantName = "AI") {
  console.log('cleanConversation called for:', rawText.slice(0, 100) + '...');

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

// ===== 文件处理核心逻辑 =====

const fileInput = document.getElementById('fileInput');
const cleanButton = document.getElementById('cleanButton');
const outputArea = document.getElementById('outputArea');

cleanButton.addEventListener('click', async () => {
  const files = fileInput.files;
  if (!files.length) return alert("请选择文件");

  const userName = document.getElementById('userNameInput').value || '用户';
  const assistantName = document.getElementById('assistantNameInput').value || 'AI';

  const zip = new JSZip();

  for (const file of files) {
    const text = await file.text();
    const cleaned = cleanConversation(text, userName, assistantName);
    const finalName = `恋人对话-${file.name.replace(/\.[^/.]+$/, "")}.txt`;
    zip.file(finalName, cleaned);
  }

  zip.generateAsync({ type: "blob" }).then(blob => {
    createDownloadLink(blob, "恋爱对话合集.zip");
  }).catch(err => {
    console.error("打包失败", err);
    outputArea.innerHTML = "打包失败，请查看控制台";
  });
});

// ===== 创建下载链接函数 =====

function createDownloadLink(blob, zipName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = zipName;
  a.textContent = `点击下载 ${zipName}`;
  a.style.display = 'block';
  a.style.marginTop = '20px';
  a.style.padding = '10px 20px';
  a.style.backgroundColor = '#6200EE';
  a.style.color = 'white';
  a.style.textDecoration = 'none';
  a.style.borderRadius = '5px';
  a.style.cursor = 'pointer';

  outputArea.innerHTML = ''; // 清除之前的提示
  outputArea.appendChild(a);

  a.onclick = () => {
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };
}
