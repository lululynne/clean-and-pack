// script.js for clean-and-pack (Updated by Gemini, with G-teacher's logic)

// 依赖的全局变量，确保在 HTML 中有相应的输入框，如果 Coze 内部实现则无需前端输入框
let userName = "用户"; // 默认用户名字
let assistantName = "AI"; // 默认AI助手名字

// 清洗对话内容函数 (由G老师提供，用于处理各种格式的原始文本)
function cleanConversation(rawText, userName = "用户", assistantName = "AI") {
    let cleaned = rawText
        .replace(/\|\|.*?\|\|/g, '') // 移除 ||...|| 形式的标记
        .replace(/\[.*?\]/g, '') // 移除 [...] 形式的标记 (如时间戳)
        .replace(/<\|.*?\|>/g, '') // 移除 <|...|> 形式的特殊 token (如 Claude/Gemini 的 turn 标记)
        .replace(/\n{2,}/g, '\n') // 将连续的多个换行符替换为单个换行符
        .trim(); // 移除首尾空白

    const lines = cleaned.split('\n').filter(line => line.trim() !== ''); // 按行分割并过滤空行
    const output = [];
    let lastSpeaker = null; // 记录上一句的说话者

    lines.forEach(line => {
        let speaker = null;
        let content = line.trim();

        // 尝试识别用户和助手的前缀
        if (content.startsWith(`${userName}：`)) {
            speaker = userName;
            content = content.substring(`${userName}：`.length).trim();
        } else if (content.startsWith(`${userName}:`)) {
            speaker = userName;
            content = content.substring(`${userName}:`.length).trim();
        } else if (content.startsWith(`${assistantName}：`)) {
            speaker = assistantName;
            content = content.substring(`${assistantName}：`.length).trim();
        } else if (content.startsWith(`${assistantName}:`)) {
            speaker = assistantName;
            content = content.substring(`${assistantName}:`.length).trim();
        } else {
            // 如果没有明确前缀，则根据上一句的说话者推断，如果第一句没有则默认为助手
            speaker = lastSpeaker || assistantName; 
        }

        output.push(`${speaker}：${content}`); // 统一输出格式
        lastSpeaker = speaker; // 更新上一句说话者
    });

    return output.join('\n').trim();
}

// 主入口函数：处理文件上传、清洗和打包
async function handleCleanAndPack() { // 使用 async 确保可以 await file.text() 和 zip.generateAsync()
    // 尝试从页面获取用户自定义的名字，如果不存在，则使用默认值
    // 如果后续 HTML 中有 userNameInput 和 assistantNameInput，这里可以生效
    const userNameInput = document.getElementById("userNameInput");
    const assistantNameInput = document.getElementById("assistantNameInput");
    
    userName = userNameInput ? userNameInput.value.trim() || "用户" : "用户";
    assistantName = assistantNameInput ? assistantNameInput.value.trim() || "AI" : "AI";

    const files = document.getElementById("fileInput").files;
    if (files.length === 0) {
        alert("请选择至少一个文件");
        return;
    }

    const zip = new JSZip(); // 初始化 JSZip 对象，确保 JSZip 库已在 HTML 中引入
    const outputArea = document.getElementById("outputArea");
    outputArea.innerHTML = "正在处理中，请稍候..."; // 显示处理中状态

    let completedFiles = 0;
    let successfulFiles = 0;
    let errors = [];

    // 确保所有文件处理完毕后才进行打包
    const promises = Array.from(files).map(async (file) => {
        try {
            // 读取文件内容（目前只支持文本文件）
            const rawText = await file.text();

            // 这里可以集成 G 老师之前提到的 detectAndParse 逻辑，但为了简化，先直接清洗
            // 未来可以根据文件类型调用不同的解析器 (pdf.js, mammoth.js)
            const cleaned = cleanConversation(rawText, userName, assistantName);
            
            // 为每个文件命名，并添加到 zip
            const filename = `恋人对话-${file.name.replace(/\.[^/.]+$/, "")}.txt`; // 移除原始文件扩展名，统一为.txt
            zip.file(filename, cleaned);
            successfulFiles++;
        } catch (error) {
            console.error(`处理文件 ${file.name} 失败:`, error);
            errors.push(`文件 ${file.name} 处理失败: ${error.message}`);
        }
    });

    // 等待所有文件处理Promise完成
    await Promise.all(promises);

    outputArea.innerHTML = ""; // 清空处理中提示

    if (successfulFiles > 0) {
        try {
            const blob = await zip.generateAsync({ type: "blob" });
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const zipName = `恋爱对话合集-${timestamp}.zip`;
            createDownloadLink(blob, zipName);
            outputArea.insertAdjacentHTML('beforeend', `<p>✅ 成功打包 ${successfulFiles} 个文件。</p>`); // 添加成功提示
        } catch (err) {
            console.error("打包ZIP失败:", err);
            outputArea.insertAdjacentHTML('beforeend', `<p>❌ 打包失败，请查看控制台错误。</p>`); // 添加失败提示
        }
    } else {
        outputArea.insertAdjacentHTML('beforeend', `<p>⚠️ 未能处理任何文件，请检查文件格式或控制台错误。</p>`); // 没有成功处理任何文件
    }

    if (errors.length > 0) {
        outputArea.insertAdjacentHTML('beforeend', `<p>以下文件处理有错误：</p><ul>${errors.map(e => `<li>${e}</li>`).join('')}</ul>`);
    }
}

// 辅助函数：创建并展示下载链接
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
    // outputArea.innerHTML = ''; // 这里不清除，让上层函数清除
    outputArea.appendChild(a);

    // 释放URL对象
    a.onclick = () => {
        setTimeout(() => URL.revokeObjectURL(url), 100);
    };
}

// 注意：G老师之前提到的 detectAndParse 和 parseJSONChat 函数，
// 以及 addToZip 函数的逻辑，已经整合进 handleCleanAndPack 和 cleanConversation 中，
// 或者在简化版中暂时移除，以便先实现核心打包功能。

// parseJSONChat 和 detectAndParse 在当前简化版中不再作为独立外部函数，
// 其逻辑已部分融入 cleanConversation 或由文件读取API处理。
// 如果未来需要支持PDF/DOCX等，再重新引入或加强 detectAndParse 函数。

// 简化版中，addToZip 不再是独立函数，其逻辑已整合到 handleCleanAndPack
// function addToZip(filename, content) { ... } // 移除此空骨架
