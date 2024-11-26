/*
  This script exists to make developing locally easier. When run, it sets up a watcher that outputs files into the given destination directory (which you should set to your Foundry VTT modules directory).
*/

const fs = require("fs");
const chokidar = require("chokidar");
const path = require("path");

// Read command line arguments for source and destination directories
const [, , srcDir = "./", destDir] = process.argv;

if (!destDir) {
  console.error(
    "Please provide a destination directory. This should be the directory inside your local Foundry modules. e.g., C://Users/{YOUR NAME}/AppData/Local/FoundryVTT/Data/modules/alkenstar-weather"
  );
  process.exit(1);
}

if (!fs.existsSync(srcDir)) {
  console.error(`Didn't find the source directory ${srcDir}. Ensure it's valid!`);
  process.exit(1);
}

// If destDir doesn't exist, create it and copy over the module.json and folder structure
if (!fs.existsSync(destDir)) {
  console.log(`Destination directory ${destDir} does not exist. Creating...`);
  fs.mkdirSync(destDir, { recursive: true });
  console.log(`Copying files from ${srcDir} to ${destDir}...`);
  copyFolderRecursiveSync(srcDir, destDir);
}

// Function to copy folder recursively
function copyFolderRecursiveSync(source, target) {
  // Check if folder needs to be created or integrated
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target);
  }

  // Copy files and folders
  if (fs.lstatSync(source).isDirectory()) {
    const files = fs.readdirSync(source);
    files.forEach(function (file) {
      const curSource = path.join(source, file);
      const curTarget = path.join(target, file);
      if (fs.lstatSync(curSource).isDirectory()) {
        copyFolderRecursiveSync(curSource, curTarget);
      } else {
        fs.copyFileSync(curSource, curTarget);
      }
    });
  }
}

const watcher = chokidar.watch(srcDir, { ignoreInitial: true });

watcher.on("add", (filePath) => {
  const relativePath = path.relative(srcDir, filePath);
  const destPath = path.join(destDir, relativePath);
  console.log(`File ${filePath} added, copying to ${destPath}...`);

  // Ensure destination directory exists
  fs.mkdirSync(path.dirname(destPath), { recursive: true });

  fs.copyFile(filePath, destPath, (err) => {
    if (err) {
      console.error(`Error copying file ${filePath}: ${err}`);
    } else {
      console.log(`File ${filePath} copied successfully.`);
    }
  });
});

watcher.on("change", (filePath) => {
  const relativePath = path.relative(srcDir, filePath);
  const destPath = path.join(destDir, relativePath);
  console.log(`File ${filePath} changed, copying to ${destPath}...`);

  // Ensure destination directory exists
  fs.mkdirSync(path.dirname(destPath), { recursive: true });

  fs.copyFile(filePath, destPath, (err) => {
    if (err) {
      console.error(`Error copying file ${filePath}: ${err}`);
    } else {
      console.log(`File ${filePath} copied successfully.`);
    }
  });
});

watcher.on("unlink", (filePath) => {
  const relativePath = path.relative(srcDir, filePath);
  const destPath = path.join(destDir, relativePath);
  console.log(
    `File ${filePath} removed from watch, deleting from ${destPath}...`
  );

  fs.unlink(destPath, (err) => {
    if (err) {
      console.error(`Error deleting file ${destPath}: ${err}`);
    } else {
      console.log(`File ${destPath} deleted successfully.`);
    }
  });
});

console.log(`Watching for changes to files in ${srcDir}...`);
console.log(`Copying files to ${destDir}...`);
