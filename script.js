function handleCleanAndPack() {
  const files = document.getElementById("fileInput").files;
  for (const file of files) {
    detectAndParse(file).then(rawText => {
      const cleaned = cleanConversation(rawText, userName, assistantName);
      addToZip(`${file.name}.txt`, cleaned);
    });
  }

  zip.generateAsync({type: "blob"}).then(blob => {
    createDownloadLink(blob, "恋爱对话合集.zip");
  });
}