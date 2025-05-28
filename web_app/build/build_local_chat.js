import { existsSync, mkdirSync, rmSync, copyFileSync, promises as fs, createWriteStream} from "fs";
import { join } from "path";
import { execSync } from 'child_process';
import os from 'os';
import https from 'follow-redirects/https.js';
import { dirname } from "path";
import { json } from "stream/consumers";


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


async function downloadFile(url, outputPath) {
  const dir = dirname(outputPath);
  await mkdirSync(dir, { recursive: true });

  const file = createWriteStream(outputPath);

  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download '${url}' (status code: ${response.statusCode})`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      file.destroy();
      reject(err);
    });
  });
}


const args = process.argv.slice(2);

let download_models = args[1] == "wm" ? false : true;

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

// download models
let model_file_urls = [
  // Xenova/bart-large-cnn
  [["summarization/Xenova/bart-large-cnn"],
  ["https://huggingface.co/Xenova/bart-large-cnn/resolve/main/config.json", "summarization/Xenova/bart-large-cnn/config.json"],
  ["https://huggingface.co/Xenova/bart-large-cnn/resolve/main/generation_config.json", "summarization/Xenova/bart-large-cnn/generation_config.json"],
  ["https://huggingface.co/Xenova/bart-large-cnn/resolve/main/tokenizer.json", "summarization/Xenova/bart-large-cnn/tokenizer.json"],
  ["https://huggingface.co/Xenova/bart-large-cnn/resolve/main/tokenizer_config.json", "summarization/Xenova/bart-large-cnn/tokenizer_config.json"],
  ["https://huggingface.co/Xenova/bart-large-cnn/resolve/main/onnx/decoder_model_merged_quantized.onnx","summarization/Xenova/bart-large-cnn/decoder_model_merged_quantized.onnx"],
  ["https://huggingface.co/Xenova/bart-large-cnn/resolve/main/onnx/encoder_model_quantized.onnx", "summarization/Xenova/bart-large-cnn/encoder_model_quantized.onnx"],
  ],
  // Xenova/distilbart-cnn-6-6
  [["summarization/Xenova/distilbart-cnn-6-6"],
  ["https://huggingface.co/Xenova/distilbart-cnn-6-6/resolve/main/config.json", "summarization/Xenova/distilbart-cnn-6-6/config.json"],
  ["https://huggingface.co/Xenova/distilbart-cnn-6-6/resolve/main/generation_config.json", "summarization/Xenova/distilbart-cnn-6-6/generation_config.json"],
  ["https://huggingface.co/Xenova/distilbart-cnn-6-6/resolve/main/tokenizer.json", "summarization/Xenova/distilbart-cnn-6-6/tokenizer.json"],
  ["https://huggingface.co/Xenova/distilbart-cnn-6-6/resolve/main/tokenizer_config.json", "summarization/Xenova/distilbart-cnn-6-6/tokenizer_config.json"],
  ["https://huggingface.co/Xenova/distilbart-cnn-6-6/resolve/main/onnx/decoder_model_merged_quantized.onnx", "summarization/Xenova/distilbart-cnn-6-6/decoder_model_merged_quantized.onnx"],
  ["https://huggingface.co/Xenova/distilbart-cnn-6-6/resolve/main/onnx/encoder_model_quantized.onnx", "summarization/Xenova/distilbart-cnn-6-6/encoder_model_quantized.onnx"],
  ],
];
if (download_models) {

  for (let model of model_file_urls) {
    // Download the model files
    for (let i = 1; i < model.length; i++) {
      const url = model[i];
      downloadFile(url[0], `../dist/models/${url[1]}`);
    }
    console.log(model)
    let fileName = {"fileName": model[0][0]}

    // Create local chat specific file.
    fs.writeFile("../dist/models/" + model[0][0] + "/browser_config.json", JSON.stringify(fileName));
  }
}