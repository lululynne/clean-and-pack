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
                cleanedContents.push({ filename: `${file.name}.txt`, content: cleaned });
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
                        // 可以更新页面UI，显示成功信息
                        document.getElementById("outputArea").innerText = "文件已打包，请点击下载链接。";
                    })
                    .catch(err => {
                        console.error("打包ZIP失败:", err);
                        document.getElementById("outputArea").innerText = "打包失败，请查看控制台错误。";
                    });
            }
        }).catch(error => {
            console.error("文件处理失败:", error);
            document.getElementById("outputArea").innerText = `处理文件 ${file.name} 失败: ${error.message}`;
            processedCount++; // 即使失败也要计数，确保最终打包逻辑触发
            if (processedCount === totalFiles && cleanedContents.length > 0) {
                 // 如果有部分文件成功处理，仍然尝试打包
                const zip = new JSZip();
                cleanedContents.forEach(item => {
                    zip.file(item.filename, item.content);
                });
                zip.generateAsync({ type: "blob" })
                    .then(blob => {
                        createDownloadLink(blob, "部分恋爱对话合集.zip");
                        document.getElementById("outputArea").innerText = "部分文件打包成功，请点击下载链接。";
                    })
                    .catch(err => {
                        console.error("部分打包ZIP失败:", err);
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
                result += `<span class="math-inline">\{speaker\}：</span>{text}\n\n`;
            }
        } else if (conv.role && conv.content) {
            // 尝试解析更简单的 JSON 结构，如直接的 role/content 结构
            const speaker = conv.role === "user" ? "用户" : "AI";
            result += `<span class="math-inline">\{speaker\}：</span>{conv.content.trim()}\n\n`;
        }
    });

    return result;
}

// 清洗对话内容 (目前简化，后续需要强化)
function cleanConversation(rawText, userName = "用户", assistantName = "AI") {
    // GPT 老师会在这里给你具体的清洗代码
    // 目前只是一个占位符，直接返回原始文本
    // 确保能处理不同平台的对话格式，去除系统信息等
    console.log('cleanConversation called for:', rawText.slice(0, 100) + '...'); // 调试用，只显示前100字符

    // 简单模拟清洗：移除一些常见的系统提示或时间戳
    let cleanedText = rawText;
    cleanedText = cleanedText.replace(/\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\]/g, ''); // 移除日期时间戳
    cleanedText = cleanedText.replace(/系统消息：/g, ''); // 移除“系统消息：”
    cleanedText = cleanedText.replace(/<\|start_of_turn\|>|\|\>|\<\|end_of_turn\|>/g, ''); // 移除一些特殊的turn标记

    // 确保每个对话都是独立的一行，并加上角色前缀（如果原始文本没有）
    const lines = cleanedText.split('\n').filter(line => line.trim() !== '');
    let formattedLines = [];
    let lastSpeaker = '';

    lines.forEach(line => {
        if (line.startsWith('用户：') || line.startsWith('AI：') || line.startsWith(userName + '：') || line.startsWith(assistantName + '：')) {
            formattedLines.push(line);
            lastSpeaker = line.startsWith('用户：') || line.startsWith(userName + '：') ? 'user' : 'assistant';
        } else {
            // 如果没有明确的角色前缀，根据上一句的角色来判断，或者默认为AI
            if (lastSpeaker === 'user') {
                formattedLines.push(`<span class="math-inline">\{userName\}：</span>{line}`);
            } else if (lastSpeaker === 'assistant') {
                formattedLines.push(`<span class="math-inline">\{assistantName\}：</span>{line}`);
            } else {
                formattedLines.push(`<span class="math-inline">\{userName\}：</span>{line}`); // 默认归为用户
            }
        }
    });

    return formattedLines.join('\n').trim();
}

// 将清洗后的内容加入 zip (需要 JSZip 库)
// 确保在 HTML 中引入了 JSZip CDN，例如：
// <script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>
function addToZip(`恋人对话-${file.name}.txt`, cleaned);
    // JSZip 对象在 handleCleanAndPack 内部创建并管理
    // 此函数不再直接操作全局 zip 对象，而是返回一个包含文件名和内容的结构
    // 以便 handleCleanAndPack 统一添加到 zip
    return { filename, content };
}


// 创建并展示下载链接
function createDownloadLink(blob, zipName) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = zipName;
    a.textContent = `点击下载 ${zipName}`;
    a.style.display = 'block';
    a.style.marginTop = '20px';
    a.style.textAlign = 'center';
    a.style.padding = '10px 20px';
    a.style.backgroundColor = '#6200EE';
    a.style.color = 'white';
    a.style.textDecoration = 'none';
    a.style.borderRadius = '5px';
    a.style.cursor = 'pointer';

    const outputArea = document.getElementById('outputArea');
    outputArea.innerHTML = ''; // 清空之前的提示
    outputArea.appendChild(a);

    // 释放URL对象
    a.onclick = () => {
        setTimeout(() => URL.revokeObjectURL(url), 100);
    };
}

// 注意：JSZip 库需要在 index.html 中通过 CDN 引入
// 例如：
// <script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>
