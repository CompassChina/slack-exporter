const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const logger = require("./log");
const {SPLIT} = require("./constants");

/**
 * Get files in specific folder
 * @param folderPath
 * @returns {*[]}
 */
function getFilesInFolderSync(folderPath) {
    try {
        let results = [];
        const list = fs.readdirSync(folderPath);

        list.forEach(file => {
            const filePath = path.join(folderPath, file);
            const stat = fs.statSync(filePath);

            if (stat && stat.isDirectory()) {
                results = results.concat(getFilesInFolderSync(filePath));
            } else if (path.extname(file).toLowerCase() === '.json') {
                results.push(filePath);
            }
        });

        logger.info(`The folder ${folderPath} has ${results.length} files`);
        return results;
    } catch (err) {
        logger.error(`GetFilesInFolder ${folderPath} Error: ${err}`);
    }
}

/**
 * Parse File Path
 * @param filePath
 * @returns {{rootFolder: string, channelId: unknown, ts: unknown}}
 */
function parseFilePath(filePath) {
    try {
        const dirPath = path.dirname(filePath);
        const folders = dirPath.split(path.sep);
        const lastTwoFolders = folders.slice(-2);

        return {
            rootFolder: dirPath,
            channelId: lastTwoFolders[0],
            ts: lastTwoFolders[1]
        };

    } catch (err) {
        logger.error(`ParseFilePath: ${filePath} Error: ${err}`);
    }
}

/**
 * Split Zip File
 * @param fileFullPath - Zip file full path
 * @param splitFileFolder - The folder to save split files
 * @param channelType - The channel type
 */
function splitZipFile(fileFullPath, splitFileFolder, channelType) {

// 使用 split 命令拆分 ZIP 文件
    const splitCommand = `split -b ${SPLIT.FILE_SIZE}M ${fileFullPath} ${splitFileFolder}/${channelType}${SPLIT.OUTPUT_PREFIX}`; // 每部分大小为 500MB

    exec(splitCommand, (error, stdout, stderr) => {
        if (error) {
            logger.error(`拆分ZIP文件 ${fileFullPath} 执行出错: ${error.message}`);
            return;
        }
        if (stderr) {
            logger.error(`拆分ZIP文件 ${fileFullPath} 命令错误: ${stderr}`);
            return;
        }
        logger.info(`${fileFullPath} 拆分成功！文件前缀为: ${SPLIT.OUTPUT_PREFIX} 所在文件夹:${splitFileFolder}`);
    });
}

function checkFileSize(fileFullPath) {
    try {
        const stats = fs.statSync(fileFullPath);
        const fileSizeInBytes = stats.size;
        const fileSizeInMB = fileSizeInBytes / 1024 / 1024;
        logger.info(`File size in MB: ${fileSizeInMB}`);
        return fileSizeInMB;
    } catch (err) {
        logger.error(`Error getting file stats: ${err}`);
        return null;
    }
}

module.exports = {
    getFilesInFolderSync,
    parseFilePath,
    splitZipFile,
    checkFileSize
}