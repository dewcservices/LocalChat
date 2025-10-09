import { existsSync, mkdirSync, rmSync, promises as fs, createWriteStream} from "fs";
import https from 'follow-redirects/https.js';
import { dirname } from "path";


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


{ // create an empty directory to store the models
  if (!existsSync("./more_models")) {
    mkdirSync("./more_models", { recursive: true });
  } else {
    console.log("more_models folder already exists. Deleting folder...");
    rmSync("./more_models", { recursive: true, force: true });
    mkdirSync("./more_models", { recursive: true });
  }
  console.log("more_models folder created successfully.");
}

{ // download models

  let model_file_urls = [
    [ 
      {
        modelName: "Xenova/distilbart-cnn-6-6",
        path: "summarization/Xenova/distilbart-cnn-6-6",
        task: "summarization"
      },
      "https://huggingface.co/Xenova/distilbart-cnn-6-6/resolve/main/config.json",
      "https://huggingface.co/Xenova/distilbart-cnn-6-6/resolve/main/generation_config.json",
      "https://huggingface.co/Xenova/distilbart-cnn-6-6/resolve/main/tokenizer.json",
      "https://huggingface.co/Xenova/distilbart-cnn-6-6/resolve/main/tokenizer_config.json",
      "https://huggingface.co/Xenova/distilbart-cnn-6-6/resolve/main/onnx/decoder_model_merged_quantized.onnx",
      "https://huggingface.co/Xenova/distilbart-cnn-6-6/resolve/main/onnx/encoder_model_quantized.onnx"
    ],
    [ 
      {
        modelName: "Xenova/distilbart-cnn-12-3",
        path: "summarization/Xenova/distilbart-cnn-12-3",
        task: "summarization"
      },
      "https://huggingface.co/Xenova/distilbart-cnn-12-3/resolve/main/config.json",
      "https://huggingface.co/Xenova/distilbart-cnn-12-3/resolve/main/generation_config.json",
      "https://huggingface.co/Xenova/distilbart-cnn-12-3/resolve/main/onnx/decoder_model_merged_quantized.onnx",
      "https://huggingface.co/Xenova/distilbart-cnn-12-3/resolve/main/onnx/encoder_model_quantized.onnx",
      "https://huggingface.co/Xenova/distilbart-cnn-12-3/resolve/main/tokenizer.json",
      "https://huggingface.co/Xenova/distilbart-cnn-12-3/resolve/main/tokenizer_config.json"
    ],
    [
      {
        modelName: "Xenova/distilbart-cnn-12-6",
        path: "summarization/Xenova/distilbart-cnn-12-6",
        task: "summarization"
      },
      "https://huggingface.co/Xenova/distilbart-cnn-12-6/resolve/main/config.json",
      "https://huggingface.co/Xenova/distilbart-cnn-12-6/resolve/main/generation_config.json",
      "https://huggingface.co/Xenova/distilbart-cnn-12-6/resolve/main/onnx/decoder_model_merged_quantized.onnx",
      "https://huggingface.co/Xenova/distilbart-cnn-12-6/resolve/main/onnx/encoder_model_quantized.onnx",
      "https://huggingface.co/Xenova/distilbart-cnn-12-6/resolve/main/tokenizer.json",
      "https://huggingface.co/Xenova/distilbart-cnn-12-6/resolve/main/tokenizer_config.json"
    ],
    [ 
      {
        modelName: "Xenova/distilbart-xsum-6-6",
        path: "summarization/Xenova/distilbart-xsum-6-6",
        task: "summarization"
      },
      "https://huggingface.co/Xenova/distilbart-xsum-6-6/resolve/main/config.json",
      "https://huggingface.co/Xenova/distilbart-xsum-6-6/resolve/main/generation_config.json",
      "https://huggingface.co/Xenova/distilbart-xsum-6-6/resolve/main/onnx/decoder_model_merged_quantized.onnx",
      "https://huggingface.co/Xenova/distilbart-xsum-6-6/resolve/main/onnx/encoder_model_quantized.onnx",
      "https://huggingface.co/Xenova/distilbart-xsum-6-6/resolve/main/tokenizer.json",
      "https://huggingface.co/Xenova/distilbart-xsum-6-6/resolve/main/tokenizer_config.json"
    ],
    [ 
      {
        modelName: "Xenova/distilbart-xsum-9-6",
        path: "summarization/Xenova/distilbart-xsum-9-6",
        task: "summarization"
      },
      "https://huggingface.co/Xenova/distilbart-xsum-9-6/resolve/main/config.json",
      "https://huggingface.co/Xenova/distilbart-xsum-9-6/resolve/main/generation_config.json",
      "https://huggingface.co/Xenova/distilbart-xsum-9-6/resolve/main/onnx/decoder_model_merged_quantized.onnx",
      "https://huggingface.co/Xenova/distilbart-xsum-9-6/resolve/main/onnx/encoder_model_quantized.onnx",
      "https://huggingface.co/Xenova/distilbart-xsum-9-6/resolve/main/tokenizer.json",
      "https://huggingface.co/Xenova/distilbart-xsum-9-6/resolve/main/tokenizer_config.json"
    ],
    [ 
      {
        modelName: "Xenova/distilbart-xsum-12-1",
        path: "summarization/Xenova/distilbart-xsum-12-1",
        task: "summarization"
      },
      "https://huggingface.co/Xenova/distilbart-xsum-12-1/resolve/main/config.json",
      "https://huggingface.co/Xenova/distilbart-xsum-12-1/resolve/main/generation_config.json",
      "https://huggingface.co/Xenova/distilbart-xsum-12-1/resolve/main/onnx/decoder_model_merged_quantized.onnx",
      "https://huggingface.co/Xenova/distilbart-xsum-12-1/resolve/main/onnx/encoder_model_quantized.onnx",
      "https://huggingface.co/Xenova/distilbart-xsum-12-1/resolve/main/tokenizer.json",
      "https://huggingface.co/Xenova/distilbart-xsum-12-1/resolve/main/tokenizer_config.json"
    ],
    [ 
      {
        modelName: "Xenova/distilbart-xsum-12-3",
        path: "summarization/Xenova/distilbart-xsum-12-3",
        task: "summarization"
      },
      "https://huggingface.co/Xenova/distilbart-xsum-12-3/resolve/main/config.json",
      "https://huggingface.co/Xenova/distilbart-xsum-12-3/resolve/main/generation_config.json",
      "https://huggingface.co/Xenova/distilbart-xsum-12-3/resolve/main/onnx/decoder_model_merged_quantized.onnx",
      "https://huggingface.co/Xenova/distilbart-xsum-12-3/resolve/main/onnx/encoder_model_quantized.onnx",
      "https://huggingface.co/Xenova/distilbart-xsum-12-3/resolve/main/tokenizer.json",
      "https://huggingface.co/Xenova/distilbart-xsum-12-3/resolve/main/tokenizer_config.json"
    ],
    [ 
      {
        modelName: "Xenova/distilbart-xsum-12-6",
        path: "summarization/Xenova/distilbart-xsum-12-6",
        task: "summarization"
      },
      "https://huggingface.co/Xenova/distilbart-xsum-12-6/resolve/main/config.json",
      "https://huggingface.co/Xenova/distilbart-xsum-12-6/resolve/main/generation_config.json",
      "https://huggingface.co/Xenova/distilbart-xsum-12-6/resolve/main/onnx/decoder_model_merged_quantized.onnx",
      "https://huggingface.co/Xenova/distilbart-xsum-12-6/resolve/main/onnx/encoder_model_quantized.onnx",
      "https://huggingface.co/Xenova/distilbart-xsum-12-6/resolve/main/tokenizer.json",
      "https://huggingface.co/Xenova/distilbart-xsum-12-6/resolve/main/tokenizer_config.json"
    ],
    [ 
      {
        modelName: "fcogidi/BARTxiv",
        path: "summarization/dcogidi/BARTxiv",
        task: "summarization"
      },
      "https://huggingface.co/fcogidi/BARTxiv/resolve/main/config.json",
      "https://huggingface.co/fcogidi/BARTxiv/resolve/main/generation_config.json",
      "https://huggingface.co/fcogidi/BARTxiv/resolve/main/onnx/decoder_model_merged_quantized.onnx",
      "https://huggingface.co/fcogidi/BARTxiv/resolve/main/onnx/encoder_model_quantized.onnx",
      "https://huggingface.co/fcogidi/BARTxiv/resolve/main/tokenizer.json",
      "https://huggingface.co/fcogidi/BARTxiv/resolve/main/tokenizer_config.json"
    ],
    [
      {
        modelName: "Xenova/distilbert-base-cased-distilled-squad",
        path: "question_answer/Xenova/distilbert-base-cased-distilled-squad",
        task: "question-answering"
      },
      "https://huggingface.co/Xenova/distilbert-base-cased-distilled-squad/resolve/main/config.json",
      "https://huggingface.co/Xenova/distilbert-base-cased-distilled-squad/resolve/main/onnx/model_quantized.onnx",
      "https://huggingface.co/Xenova/distilbert-base-cased-distilled-squad/resolve/main/tokenizer.json",
      "https://huggingface.co/Xenova/distilbert-base-cased-distilled-squad/resolve/main/tokenizer_config.json"
    ],
    [
      {
        modelName: "tomasmcm/intel-dynamic-tinybert-onnx",
        path: "question_answer/tomasmcm/intel-dynamic-tinybert-onnx",
        task: "question-answering"
      },
      "https://huggingface.co/tomasmcm/intel-dynamic-tinybert-onnx/resolve/main/config.json",
      "https://huggingface.co/tomasmcm/intel-dynamic-tinybert-onnx/resolve/main/onnx/model_quantized.onnx",
      "https://huggingface.co/tomasmcm/intel-dynamic-tinybert-onnx/resolve/main/tokenizer.json",
      "https://huggingface.co/tomasmcm/intel-dynamic-tinybert-onnx/resolve/main/tokenizer_config.json"
    ],
    [
      {
        modelName: "jestevesv/distilbert-base-spanish-uncased-finetuned-qa-mlqa-onnx",
        path: "question_answer/jestevesv/distilbert-base-spanish-uncased-finetuned-qa-mlqa-onnx",
        task: "question-answering"
      },
      "https://huggingface.co/jestevesv/distilbert-base-spanish-uncased-finetuned-qa-mlqa-onnx/resolve/main/config.json",
      "https://huggingface.co/jestevesv/distilbert-base-spanish-uncased-finetuned-qa-mlqa-onnx/resolve/main/onnx/model_quantized.onnx",
      "https://huggingface.co/jestevesv/distilbert-base-spanish-uncased-finetuned-qa-mlqa-onnx/resolve/main/tokenizer.json",
      "https://huggingface.co/jestevesv/distilbert-base-spanish-uncased-finetuned-qa-mlqa-onnx/resolve/main/tokenizer_config.json"
    ],
    [
      {
        modelName: "onnx-community/bert-multi-english-german-squad2-ONNX",
        path: "question_answer/onnx-community/bert-multi-english-german-squad2-ONNX",
        task: "question-answering"
      },
      "https://huggingface.co/onnx-community/bert-multi-english-german-squad2-ONNX/resolve/main/config.json",
      "https://huggingface.co/onnx-community/bert-multi-english-german-squad2-ONNX/resolve/main/onnx/model_quantized.onnx",
      "https://huggingface.co/onnx-community/bert-multi-english-german-squad2-ONNX/resolve/main/tokenizer.json",
      "https://huggingface.co/onnx-community/bert-multi-english-german-squad2-ONNX/resolve/main/tokenizer_config.json"
    ]
  ]

  console.log("\nDownloading Models...");

  for (let model of model_file_urls) {
    for (let i = 1; i < model.length; i++) {
      const url = model[i];
      console.log(`Downloading: ${url}`);
      let fileName = url.split('/').at(-1);
      downloadFile(url, `./more_models/${model[0].path}/${fileName}`);
    }

    // Create local chat specific file.
    fs.writeFile(`./more_models/${model[0].path}/browser_config.json`, JSON.stringify(model[0]));
  }

}
