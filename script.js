function detectAndParse(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      resolve(e.target.result);
    };
    reader.readAsText(file);
  });
}

function cleanConversation(rawText, userName = "用户", assistantName = "AI") {
  let cleanedText = "";

  try {
    const json = JSON.parse(rawText);

    // GPT JSON 格式：包含 mapping 和 message.parts
    if (json.mapping) {
      const mapping = json.mapping;
      const messages = [];

      for (const key in mapping) {
        const msg = mapping[key].message;
        if (!msg || !msg.author || !msg.content || !msg.content.parts) continue;

        const role = msg.author.role;
        const speaker = role === "user" ? userName : assistantName;
        const text = msg.content.parts.join("\n").trim();
        messages.push(`${speaker}：${text}`);
      }

      cleanedText = messages.join("\n\n");
    }
    // Claude JSON 格式（或手写 JSON array）
    else if (Array.isArray(json)) {
      const messages = [];

      for (const entry of json) {
        if (!entry.role || !entry.content) continue;
        const speaker = entry.role === "user" ? userName : assistantName;
        messages.push(`${speaker}：${entry.content.trim()}`);
      }

      cleanedText = messages.join("\n\n");
    }
    // 不是结构化 JSON
    else {
      cleanedText = rawText;
    }
  } catch (err) {
    // fallback: 处理 TXT 文本
    const lines = rawText.split('\n').filter(line => line.trim() !== '');
    const output = [];
    let lastSpeaker = assistantName;

    for (let line of lines) {
      line = line.trim();
      if (line.startsWith(`${userName}：`) || line.startsWith(`${userName}:`)) {
        output.push(`${userName}：${line.replace(`${userName}：`, '').replace(`${userName}:`, '').trim()}`);
        lastSpeaker = userName;
      } else if (line.startsWith(`${assistantName}：`) || line.startsWith(`${assistantName}:`)) {
        output.push(`${assistantName}：${line.replace(`${assistantName}：`, '').replace(`${assistantName}:`, '').trim()}`);
        lastSpeaker = assistantName;
      } else {
        output.push(`${lastSpeaker}：${line}`);
      }
    }

    cleanedText = output.join('\n');
  }

  return cleanedText.trim();
}

function addToZip(filename, content) {
  const finalFilename = `恋人对话-${filename.replace(/\.[^.]+$/, "")}.txt`;
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
    detectAndParse(file).then(rawText => {
      const cleaned = cleanConversation(rawText, userName, assistantName);
      const cleanedItem = addToZip(file.name, cleaned);
      zip.file(cleanedItem.filename, cleanedItem.content);

      processedCount++;
      if (processedCount === files.length) {
        zip.generateAsync({ type: "blob" }).then(blob => {
          createDownloadLink(blob, "恋人对话合集.zip");
        });
      }
    });
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
