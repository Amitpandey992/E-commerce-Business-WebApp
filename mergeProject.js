import fs from "fs";
import path from "path";

// exclude list (folders and file patterns)
const exclude = [
    "node_modules",
    "package-lock.json",
    ".git",
    ".env",
    "dist",
    "build",
    ".gitignore",
];

// file extensions to ignore
const excludedExtensions = [
    ".png",
    ".jpg",
    ".jpeg",
    ".svg",
    ".gif",
    ".webp",
    ".ico",
];

// recursively get all files
const getAllFiles = (dirPath, arrayOfFiles = []) => {
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
        const filePath = path.join(dirPath, file);
        const stat = fs.lstatSync(filePath);

        // skip excluded folders
        if (stat.isDirectory()) {
            if (!exclude.includes(file)) {
                getAllFiles(filePath, arrayOfFiles);
            }
        } else {
            // skip excluded extensions
            const ext = path.extname(file).toLowerCase();
            if (!excludedExtensions.includes(ext) && !exclude.includes(file)) {
                arrayOfFiles.push(filePath);
            }
        }
    });

    return arrayOfFiles;
};

// merge into single txt
const mergeFiles = (inputDir, outputFile) => {
    const files = getAllFiles(inputDir);

    let mergedContent = "";
    files.forEach((file) => {
        const content = fs.readFileSync(file, "utf8");
        mergedContent += `\n\n// FILE: ${file}\n\n${content}\n`;
    });

    fs.writeFileSync(outputFile, mergedContent, "utf8");
    console.log(`✅ Merged ${files.length} files into ${outputFile}`);
};

// usage
mergeFiles(process.cwd(), "project-merged.txt");
