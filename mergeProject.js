import fs from "fs";
import path from "path";

// exclude list
const exclude = ["node_modules", "package-lock.json", ".git", "dist", "build"];

// recursively get all files
const getAllFiles = (dirPath, arrayOfFiles = []) => {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    const stat = fs.lstatSync(filePath);

    if (stat.isDirectory()) {
      if (!exclude.includes(file)) {
        getAllFiles(filePath, arrayOfFiles);
      }
    } else {
      if (!exclude.includes(file)) {
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
