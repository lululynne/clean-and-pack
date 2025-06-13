function handleCleanAndPack() {
  const files = document.getElementById("fileInput").files;
  for (const file of files) {
    detectAndParse(file).then(rawText => {
      const cleaned = cleanConversation(rawText, userName, assistantName);
      addToZip(`${file.name}.txt`, cleaned);
    });
  }
function parseJSONChat(raw) {
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return "无法解析 JSON";
  }

  const conversations = Array.isArray(data) ? data : [data];
  let result = "";

  conversations.forEach(conv => {
    const mapping = conv.mapping || {};
    for (const key in mapping) {
      const msg = mapping[key].message;
      if (!msg || !msg.author || !msg.content || !msg.content.parts) continue;

      const speaker = msg.author.role === "user" ? userName : assistantName;
      const text = msg.content.parts.join("\n").trim();
      result += `${speaker}：${text}\n\n`;
    }
  });

  return result;
}
 async function detectAndParse(file) {
  const fileName = file.name.toLowerCase();

  // 读取内容
  const text = await file.text();

  if (fileName.endsWith(".json")) {
    return parseJSONChat(text); // 等下写这个
  } else if (fileName.endsWith(".txt")) {
    return text;
  } else if (fileName.endsWith(".pdf")) {
    alert("PDF 格式暂未支持自动解析，请手动转 txt");
    return null;
  } else if (fileName.endsWith(".docx")) {
    alert("DOCX 格式暂未支持自动解析，请手动转 txt");
    return null;
  } else {
    alert("不支持的文件类型");
    return null;
  }
}

function cleanConversation(rawText, userName, assistantName) {
    // GPT 老师会在这里给你具体的清洗代码
    // 可以先留空，或者简单写个 return rawText;
    console.log('cleanConversation called for:', rawText); // 调试用
    return rawText;
}

function addToZip(filename, content) {
    // GPT 老师会在这里给你具体的添加到 zip 的代码
    console.log('addToZip called with:', filename); // 调试用
    // 返回一个虚拟的 zip 对象，或留空
}

function createDownloadLink(blob, zipName) {
    // GPT 老师会在这里给你具体的创建下载链接的代码
    console.log('createDownloadLink called for:', zipName); // 调试用
    // 可以先不实现，或者 console.log 提示
}
