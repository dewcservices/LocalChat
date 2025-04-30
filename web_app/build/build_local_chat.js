import { existsSync, mkdirSync, rmSync, copyFileSync, promises as fs } from "fs";
import { join } from "path";
import { execSync } from 'child_process';
import os from 'os';


// Function to recursively copy a directory
async function copyDirectory(src, dest) {
    try {
        // Check if the source directory exists
        const stats = await fs.stat(src);
        if (!stats.isDirectory()) {
            throw new Error(`${src} is not a directory`);
        }

        // Ensure the destination directory exists
        await fs.mkdir(dest, { recursive: true });

        // Read all items in the source directory
        const files = await fs.readdir(src);

        for (const file of files) {
            const srcPath = join(src, file);
            const destPath = join(dest, file);

            const fileStats = await fs.stat(srcPath);

            if (fileStats.isDirectory()) {
                // Recursively copy subdirectories
                await copyDirectory(srcPath, destPath);
            } else {
                // Copy file
                await fs.copyFile(srcPath, destPath);
            }
        }

        console.log(`Directory ${src} copied to ${dest}`);
    } catch (error) {
        console.error("Error copying directory:", error);
    }
}


const args = process.argv.slice(2);

let target_operating_system = args[0];
let fileserver_exe_name = "";
let go_build_command = "";

// set the go_build_command depending on the current operating system
if (os.platform().indexOf("win") != -1) {
    // building on windows
    go_build_command = `set GOOS=${target_operating_system}&& set GOARCH=amd64&& go build -C ..`;

} else if (os.platform().indexOf("linux") != -1) {
    // building on linux
    go_build_command = `GOOS=${target_operating_system} GOARCH=amd64 go build -C ..`;

} else throw new Error(`Building on unsupported operating system: ${os.platform()}`);

// set the executable name based on the target operating system
if (target_operating_system === "windows") fileserver_exe_name = "fileserver.exe"
else if (target_operating_system === "linux") fileserver_exe_name = "fileserver"
else throw new Error(`${target_operating_system} is not a supported operating system build target.`);

// compile the go fileserver
let output = execSync(go_build_command, { encoding: "utf8" });
console.log(output);

// bundle the web app
output = execSync("npm run build", { encoding: "utf8" });
console.log(output);

// create an empty dist directory
if (!existsSync("../dist")) {
    mkdirSync("../dist", { recursive: true });
} else {
    console.log("Dist folder already exists. Deleting folder...");
    rmSync("../dist", { recursive: true, force: true });
    mkdirSync("../dist", { recursive: true });
}
console.log("Dist folder created successfully.");

// copy the necessary files/directories to the new dist folder
copyFileSync(`../${fileserver_exe_name}`, `../dist/${fileserver_exe_name}`)
console.log("Copied fileserver executable into dist successfully.")

copyDirectory("./dist", "../dist")

copyDirectory("../models", "../dist/models")
