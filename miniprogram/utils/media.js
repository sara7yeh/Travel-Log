function chooseAndSaveMedia() {
  return new Promise((resolve, reject) => {
    wx.chooseMedia({
      count: 9,
      mediaType: ["image", "video"],
      sourceType: ["album", "camera"],
      success: async (result) => {
        try {
          const saved = [];
          for (const file of result.tempFiles) {
            const savedPath = await saveFile(file.tempFilePath);
            saved.push({ path: savedPath, type: file.fileType || inferType(savedPath) });
          }
          resolve(saved);
        } catch (error) {
          reject(error);
        }
      },
      fail: reject
    });
  });
}

function saveFile(tempFilePath) {
  return new Promise((resolve, reject) => {
    wx.getFileSystemManager().saveFile({
      tempFilePath,
      success: ({ savedFilePath }) => resolve(savedFilePath),
      fail: reject
    });
  });
}

function inferType(path) {
  return /\.(mp4|mov|m4v)$/i.test(path) ? "video" : "image";
}

module.exports = { chooseAndSaveMedia };
