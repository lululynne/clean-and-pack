// script.js for clean-and-pack

// 主入口函数：处理文件上传、清洗和打包
function handleCleanAndPack() {
    // 获取用户自定义的名字，如果不存在则使用默认值
    // 注意：在 clean-and-pack 的当前 index.html 骨架中没有 userName 和 assistantName 输入框
    // 所以这里先定义默认值，或者等到后续 UI 完善时再从输入框获取
    const userName = "用户"; // 默认用户名字
    const assistantName = "AI"; // 默认AI助手名字

    const files = document.getElementById("fileInput").files;
    if (files.length === 0) {
        alert("请选择文件！");
        return;
    }

    // 用于存储所有清洗后的文本内容，后续打包成zip
    let cleanedContents = [];
    let processedCount = 0; // 记录已处理的文件数量
    const totalFiles = files.length;

    for (const file of files) {
        detectAndParse(file).then(rawText => {
            if (rawText) { // 只有成功解析才进行清洗和添加
                const cleaned = cleanConversation(rawText, userName, assistantName);
                // 正确调用 addToZip 函数，并将其返回的对象添加到 cleanedContents
                // 注意：这里传递的是文件的原始名称，AddToZip 函数会加上前缀
                cleanedContents.push(addToZip(file.name, cleaned)); 
            }
            processedCount++;

            // 当所有文件都处理完毕后，再打包
            if (processedCount === totalFiles) {
                // 初始化 JSZip 对象
                const zip = new JSZip(); // 需要确保 JSZip 库已引入

                cleanedContents.forEach(item => {
                    zip.file(item.filename, item.content);
                });

                zip.generateAsync({ type: "blob" })
                    .then(blob => {
                        const timeStamp = new Date().toISOString().replace(/[:.]/g, "-"); // 生成时间戳，替换掉特殊字符
                        const zipName = `恋爱对话合集-${timeStamp}.zip`; // 组合文件名

                        document.getElementById("outputArea").innerHTML = ""; // 清空旧内容
                        createDownloadLink(blob, zipName); // 调用创建下载链接的函数

                        // 可以更新页面UI，显示成功信息
                        // document.getElementById("outputArea").innerText = "文件已打包，请点击下载链接。"; // 这一行可以注释掉或移除
                    })
                    .catch(err => {
                        console.error("打包ZIP失败:", err);
                        document.getElementById("outputArea").innerHTML = ""; // 清空旧内容
                        document.getElementById("outputArea").innerText = "打包失败，请查看控制台错误。"; // 显示错误信息
                    });
            }
        }).catch(error => {
            console.error("文件处理失败:", error);
            document.getElementById("outputArea").innerText = `处理文件 ${file.name} 失败: ${error.message}`; // 仍然显示特定文件的错误
            processedCount++; // 即使失败也要计数，确保最终打包逻辑触发
            if (processedCount === totalFiles && cleanedContents.length > 0) {
                 // 如果有部分文件成功处理，仍然尝试打包
                const zip = new JSZip();
                cleanedContents.forEach(item => {
                    zip.file(item.filename, item.content);
                });
                zip.generateAsync({ type: "blob" })
                    .then(blob => {
                        document.getElementById("outputArea").innerHTML = ""; // 清空旧内容
                        createDownloadLink(blob, "部分恋爱对话合集.zip"); // 调用创建下载链接的函数，使用固定的部分打包文件名
                        // 可以更新页面UI，显示成功信息
                        // document.getElementById("outputArea").innerText = "部分文件打包成功，请点击下载链接。"; // <-- 这一行可以注释掉或移除
                    })
                    .catch(err => {
                        console.error("部分打包ZIP失败:", err);
                        document.getElementById("outputArea").innerHTML = ""; // 清空旧内容
                        document.getElementById("outputArea").innerText = "部分打包失败，请查看控制台错误。"; // 显示错误信息
                    });
            }
        });
    }
}

// 文件类型识别与文本提取
async function detectAndParse(file) {
    const fileName = file.name.toLowerCase();
    const text = await file.text(); // 默认读取为文本

    if (fileName.endsWith(".json")) {
        return parseJSONChat(text);
    } else if (fileName.endsWith(".txt")) {
        return text;
    } else if (fileName.endsWith(".pdf")) {
        // alert("PDF 格式暂未支持自动解析，请手动转 txt");
        // 这里的 PDF 解析需要引入 pdf.js 库，并编写具体的解析逻辑
        // 暂时返回空，或者可以集成pdf.js的异步解析
        console.warn("PDF 格式暂未支持自动解析。");
        return null;
    } else if (fileName.endsWith(".docx")) {
        // alert("DOCX 格式暂未支持自动解析，请手动转 txt");
        // 这里的 DOCX 解析需要引入 mammoth.js 库，并编写具体的解析逻辑
        // 暂时返回空，或者可以集成mammoth.js的异步解析
        console.warn("DOCX 格式暂未支持自动解析。");
        return null;
    } else {
        alert("不支持的文件类型");
        return null;
    }
}

// 针对 GPT JSON 对话的解析函数
function parseJSONChat(raw) {
    let data;
    try {
        data = JSON.parse(raw);
    } catch (e) {
        console.error("无法解析 JSON:", e);
        return "无法解析 JSON 文件内容";
    }

    const conversations = Array.isArray(data) ? data : [data];
    let result = "";

    conversations.forEach(conv => {
        // 优先检查 GPT JSON 的 mapping 结构
        const mapping = conv.mapping;
        if (mapping) {
            for (const key in mapping) {
                const msg = mapping[key].message;
                if (!msg || !msg.author || !msg.content || !msg.content.parts) continue;

                // 使用之前在 handleCleanAndPack 定义的 userName 和 assistantName
                // 但由于当前 clean-and-pack 的 index.html 骨架中没有这些输入框
                // 暂时在这里硬编码，后续根据 UI 完善
                const speaker = msg.author.role === "user" ? "用户" : "AI";
                const text = msg.content.parts.join("\n").trim();
                result += `${speaker}: ${text}\n\n`;
            }
        } else if (conv.role && conv.content) {
            // 尝试解析更简单的 JSON 结构，如直接的 role/content 结构
            const speaker = conv.role === "user" ? "用户" : "AI";
            result += `${speaker}: ${text}\n\n`;
        }
    });

    return result;
}

// 清洗对话内容 (目前简化，后续需要强化)
function cleanConversation(rawText, userName = "用户", assistantName = "AI") {
  console.log('cleanConversation called for:', rawText.slice(0, 100) + '...');

  // 先去除系统标记与格式字符
  let cleaned = rawText
    .replace(/\|\|.*?\|\|/g, '') // 移除如 ||系统提示|| 结构
    .replace(/\[.*?\]/g, '') // 移除如 [timestamp] 结构
    .replace(/\n{2,}/g, '\n') // 连续换行合并
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
      speaker = lastSpeaker || assistantName; // 如果无法识别，就用上一次说话人，或默认AI
    }

    output.push(`${speaker}：${content}`);
    lastSpeaker = speaker;
  });

  return output.join('\n').trim();
}
    outputArea.innerHTML = ''; // 清空之前的提示
    outputArea.appendChild(a);

    // 释放URL对象
    a.onclick = () => {
        setTimeout(() => URL.revokeObjectURL(url), 100);
    };
}
