import { existsSync, mkdirSync, rmSync, copyFileSync, promises as fs, createWriteStream} from "fs";
import { join } from "path";
import { execSync } from 'child_process';
import os from 'os';
import https from 'follow-redirects/https.js';
import { dirname } from "path";


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

let download_models = args[0] == "wm" ? false : true;

// compile the fileservers
if (os.platform() === "win32") { // compiling on a windows system

  // windows executable
  let output = execSync(`set GOOS=windows&& set GOARCH=amd64&& go build -C ..`, { encoding: 'utf-8' });
  console.log(output);

  // linux executable
  output = execSync(`set GOOS=linux&& set GOARCH=amd64&& go build -C ..`, { encoding: 'utf-8' });
  console.log(output);

} else if (os.platform() === "linux") { // compiling on a linux system

  // windows executable
  let output = execSync(`GOOS=windows GOARCH=amd64 go build -C ..`, { encoding: 'utf-8' });
  console.log(output);

  // linux executable
  output = execSync(`GOOS=linux GOARCH=amd64 go build -C ..`, { encoding: 'utf-8' });
  console.log(output);

} else throw new Error(`Cannot build on current operating system: ${os.platform()}`);

// bundle the web app
let output = execSync("npm run build", { encoding: "utf8" });
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
copyFileSync(`../fileserver.exe`, `../dist/fileserver.exe`);
copyFileSync('../fileserver', '../dist/fileserver');
console.log("Copied fileserver executables into dist successfully.")

copyDirectory("./dist", "../dist")

// download models
let model_file_urls = [
  [ // Xenova/bart-large-cnn
    {
      modelName: "Xenova/bart-large-cnn",
      path: "summarization/Xenova/bart-large-cnn",
      task: "summarization"
    },
    ["https://huggingface.co/Xenova/bart-large-cnn/resolve/main/config.json", "summarization/Xenova/bart-large-cnn/config.json"],
    ["https://huggingface.co/Xenova/bart-large-cnn/resolve/main/generation_config.json", "summarization/Xenova/bart-large-cnn/generation_config.json"],
    ["https://huggingface.co/Xenova/bart-large-cnn/resolve/main/tokenizer.json", "summarization/Xenova/bart-large-cnn/tokenizer.json"],
    ["https://huggingface.co/Xenova/bart-large-cnn/resolve/main/tokenizer_config.json", "summarization/Xenova/bart-large-cnn/tokenizer_config.json"],
    ["https://huggingface.co/Xenova/bart-large-cnn/resolve/main/onnx/decoder_model_merged_quantized.onnx","summarization/Xenova/bart-large-cnn/decoder_model_merged_quantized.onnx"],
    ["https://huggingface.co/Xenova/bart-large-cnn/resolve/main/onnx/encoder_model_quantized.onnx", "summarization/Xenova/bart-large-cnn/encoder_model_quantized.onnx"],
  ],
  // [ // Xenova/distilbart-cnn-6-6
  //   {
  //     modelName: "Xenova/distilbart-cnn-6-6",
  //     path: "summarization/Xenova/distilbart-cnn-6-6",
  //     task: "summarization"
  //   },
  //   ["https://huggingface.co/Xenova/distilbart-cnn-6-6/resolve/main/config.json", "summarization/Xenova/distilbart-cnn-6-6/config.json"],
  //   ["https://huggingface.co/Xenova/distilbart-cnn-6-6/resolve/main/generation_config.json", "summarization/Xenova/distilbart-cnn-6-6/generation_config.json"],
  //   ["https://huggingface.co/Xenova/distilbart-cnn-6-6/resolve/main/tokenizer.json", "summarization/Xenova/distilbart-cnn-6-6/tokenizer.json"],
  //   ["https://huggingface.co/Xenova/distilbart-cnn-6-6/resolve/main/tokenizer_config.json", "summarization/Xenova/distilbart-cnn-6-6/tokenizer_config.json"],
  //   ["https://huggingface.co/Xenova/distilbart-cnn-6-6/resolve/main/onnx/decoder_model_merged_quantized.onnx", "summarization/Xenova/distilbart-cnn-6-6/decoder_model_merged_quantized.onnx"],
  //   ["https://huggingface.co/Xenova/distilbart-cnn-6-6/resolve/main/onnx/encoder_model_quantized.onnx", "summarization/Xenova/distilbart-cnn-6-6/encoder_model_quantized.onnx"],
  // ],
  [ // Xenova/distilbert-base-uncased-distilled-squad
    {
      modelName: "Xenova/distilbert-base-uncased-distilled-squad",
      path: "question_answer/Xenova/distilbert-base-uncased-distilled-squad",
      task: "question_answer"
    },
    ["https://huggingface.co/Xenova/distilbert-base-uncased-distilled-squad/resolve/main/config.json", "question_answer/Xenova/distilbert-base-uncased-distilled-squad/config.json"],
    ["https://huggingface.co/Xenova/distilbert-base-uncased-distilled-squad/resolve/main/onnx/model_quantized.onnx", "question_answer/Xenova/distilbert-base-uncased-distilled-squad/model_quantized.onnx"],
    ["https://huggingface.co/Xenova/distilbert-base-uncased-distilled-squad/resolve/main/tokenizer.json", "question_answer/Xenova/distilbert-base-uncased-distilled-squad/tokenizer.json"],
    ["https://huggingface.co/Xenova/distilbert-base-uncased-distilled-squad/resolve/main/tokenizer_config.json", "question_answer/Xenova/distilbert-base-uncased-distilled-squad/tokenizer_config.json"]
  ],
  [ // translation/Xenova/nllb-200-distilled-600M
    {
      modelName: "Xenova/nllb-200-distilled-600M",
      path: "translation/Xenova/nllb-200-distilled-600M",
      task: "translation",
      languages: {"Acehnese (Arabic script)": "ace_Arab", "Acehnese (Latin script)": "ace_Latn", "Mesopotamian Arabic": "acm_Arab", "Ta\u00e2\u20ac\u2122izzi-Adeni Arabic": "acq_Arab", "Tunisian Arabic": "aeb_Arab", "Afrikaans": "afr_Latn", "South Levantine Arabic": "ajp_Arab", "Akan": "aka_Latn", "Amharic": "amh_Ethi", "North Levantine Arabic": "apc_Arab", "Modern Standard Arabic": "arb_Arab", "Modern Standard Arabic (Romanized)": "arb_Latn", "Najdi Arabic": "ars_Arab", "Moroccan Arabic": "ary_Arab", "Egyptian Arabic": "arz_Arab", "Assamese": "asm_Beng", "Asturian": "ast_Latn", "Awadhi": "awa_Deva", "Central Aymara": "ayr_Latn", "South Azerbaijani": "azb_Arab", "North Azerbaijani": "azj_Latn", "Bashkir": "bak_Cyrl", "Bambara": "bam_Latn", "Balinese": "ban_Latn", "Belarusian": "bel_Cyrl", "Bemba": "bem_Latn", "Bengali": "ben_Beng", "Bhojpuri": "bho_Deva", "Banjar (Arabic script)": "bjn_Arab", "Banjar (Latin script)": "bjn_Latn", "Standard Tibetan": "bod_Tibt", "Bosnian": "bos_Latn", "Buginese": "bug_Latn", "Bulgarian": "bul_Cyrl", "Catalan": "cat_Latn", "Cebuano": "ceb_Latn", "Czech": "ces_Latn", "Chokwe": "cjk_Latn", "Central Kurdish": "ckb_Arab", "Crimean Tatar": "crh_Latn", "Welsh": "cym_Latn", "Danish": "dan_Latn", "German": "deu_Latn", "Southwestern Dinka": "dik_Latn", "Dyula": "dyu_Latn", "Dzongkha": "dzo_Tibt", "Greek": "ell_Grek", "English": "eng_Latn", "Esperanto": "epo_Latn", "Estonian": "est_Latn", "Basque": "eus_Latn", "Ewe": "ewe_Latn", "Faroese": "fao_Latn", "Fijian": "fij_Latn", "Finnish": "fin_Latn", "Fon": "fon_Latn", "French": "fra_Latn", "Friulian": "fur_Latn", "Nigerian Fulfulde": "fuv_Latn", "Scottish Gaelic": "gla_Latn", "Irish": "gle_Latn", "Galician": "glg_Latn", "Guarani": "grn_Latn", "Gujarati": "guj_Gujr", "Haitian Creole": "hat_Latn", "Hausa": "hau_Latn", "Hebrew": "heb_Hebr", "Hindi": "hin_Deva", "Chhattisgarhi": "hne_Deva", "Croatian": "hrv_Latn", "Hungarian": "hun_Latn", "Armenian": "hye_Armn", "Igbo": "ibo_Latn", "Ilocano": "ilo_Latn", "Indonesian": "ind_Latn", "Icelandic": "isl_Latn", "Italian": "ita_Latn", "Javanese": "jav_Latn", "Japanese": "jpn_Jpan", "Kabyle": "kab_Latn", "Jingpho": "kac_Latn", "Kamba": "kam_Latn", "Kannada": "kan_Knda", "Kashmiri (Arabic script)": "kas_Arab", "Kashmiri (Devanagari script)": "kas_Deva", "Georgian": "kat_Geor", "Central Kanuri (Arabic script)": "knc_Arab", "Central Kanuri (Latin script)": "knc_Latn", "Kazakh": "kaz_Cyrl", "Kabiy\u00c3\u00a8": "kbp_Latn", "Kabuverdianu": "kea_Latn", "Khmer": "khm_Khmr", "Kikuyu": "kik_Latn", "Kinyarwanda": "kin_Latn", "Kyrgyz": "kir_Cyrl", "Kimbundu": "kmb_Latn", "Northern Kurdish": "kmr_Latn", "Kikongo": "kon_Latn", "Korean": "kor_Hang", "Lao": "lao_Laoo", "Ligurian": "lij_Latn", "Limburgish": "lim_Latn", "Lingala": "lin_Latn", "Lithuanian": "lit_Latn", "Lombard": "lmo_Latn", "Latgalian": "ltg_Latn", "Luxembourgish": "ltz_Latn", "Luba-Kasai": "lua_Latn", "Ganda": "lug_Latn", "Luo": "luo_Latn", "Mizo": "lus_Latn", "Standard Latvian": "lvs_Latn", "Magahi": "mag_Deva", "Maithili": "mai_Deva", "Malayalam": "mal_Mlym", "Marathi": "mar_Deva", "Minangkabau (Arabic script)": "min_Arab", "Minangkabau (Latin script)": "min_Latn", "Macedonian": "mkd_Cyrl", "Plateau Malagasy": "plt_Latn", "Maltese": "mlt_Latn", "Meitei (Bengali script)": "mni_Beng", "Halh Mongolian": "khk_Cyrl", "Mossi": "mos_Latn", "Maori": "mri_Latn", "Burmese": "mya_Mymr", "Dutch": "nld_Latn", "Norwegian Nynorsk": "nno_Latn", "Norwegian Bokm\u00c3\u00a5l": "nob_Latn", "Nepali": "npi_Deva", "Northern Sotho": "nso_Latn", "Nuer": "nus_Latn", "Nyanja": "nya_Latn", "Occitan": "oci_Latn", "West Central Oromo": "gaz_Latn", "Odia": "ory_Orya", "Pangasinan": "pag_Latn", "Eastern Panjabi": "pan_Guru", "Papiamento": "pap_Latn", "Western Persian": "pes_Arab", "Polish": "pol_Latn", "Portuguese": "por_Latn", "Dari": "prs_Arab", "Southern Pashto": "pbt_Arab", "Ayacucho Quechua": "quy_Latn", "Romanian": "ron_Latn", "Rundi": "run_Latn", "Russian": "rus_Cyrl", "Sango": "sag_Latn", "Sanskrit": "san_Deva", "Santali": "sat_Olck", "Sicilian": "scn_Latn", "Shan": "shn_Mymr", "Sinhala": "sin_Sinh", "Slovak": "slk_Latn", "Slovenian": "slv_Latn", "Samoan": "smo_Latn", "Shona": "sna_Latn", "Sindhi": "snd_Arab", "Somali": "som_Latn", "Southern Sotho": "sot_Latn", "Spanish": "spa_Latn", "Tosk Albanian": "als_Latn", "Sardinian": "srd_Latn", "Serbian": "srp_Cyrl", "Swati": "ssw_Latn", "Sundanese": "sun_Latn", "Swedish": "swe_Latn", "Swahili": "swh_Latn", "Silesian": "szl_Latn", "Tamil": "tam_Taml", "Tatar": "tat_Cyrl", "Telugu": "tel_Telu", "Tajik": "tgk_Cyrl", "Tagalog": "tgl_Latn", "Thai": "tha_Thai", "Tigrinya": "tir_Ethi", "Tamasheq (Latin script)": "taq_Latn", "Tamasheq (Tifinagh script)": "taq_Tfng", "Tok Pisin": "tpi_Latn", "Tswana": "tsn_Latn", "Tsonga": "tso_Latn", "Turkmen": "tuk_Latn", "Tumbuka": "tum_Latn", "Turkish": "tur_Latn", "Twi": "twi_Latn", "Central Atlas Tamazight": "tzm_Tfng", "Uyghur": "uig_Arab", "Ukrainian": "ukr_Cyrl", "Umbundu": "umb_Latn", "Urdu": "urd_Arab", "Northern Uzbek": "uzn_Latn", "Venetian": "vec_Latn", "Vietnamese": "vie_Latn", "Waray": "war_Latn", "Wolof": "wol_Latn", "Xhosa": "xho_Latn", "Eastern Yiddish": "ydd_Hebr", "Yoruba": "yor_Latn", "Yue Chinese": "yue_Hant", "Chinese (Simplified)": "zho_Hans", "Chinese (Traditional)": "zho_Hant", "Standard Malay": "zsm_Latn", "Zulu": "zul_Latn"}
    },
    ["https://huggingface.co/Xenova/nllb-200-distilled-600M/resolve/main/config.json", "translation/Xenova/nllb-200-distilled-600M/config.json"],
    ["https://huggingface.co/Xenova/nllb-200-distilled-600M/resolve/main/generation_config.json", "translation/Xenova/nllb-200-distilled-600M/generation_config.json"],
    ["https://huggingface.co/Xenova/nllb-200-distilled-600M/resolve/main/onnx/decoder_model_merged_quantized.onnx", "translation/Xenova/nllb-200-distilled-600M/decoder_model_merged_quantized.onnx"],
    ["https://huggingface.co/Xenova/nllb-200-distilled-600M/resolve/main/onnx/encoder_model_quantized.onnx", "translation/Xenova/nllb-200-distilled-600M/encoder_model_quantized.onnx"],
    ["https://huggingface.co/Xenova/nllb-200-distilled-600M/resolve/main/tokenizer.json", "translation/Xenova/nllb-200-distilled-600M/tokenizer.json"],
    ["https://huggingface.co/Xenova/nllb-200-distilled-600M/resolve/main/tokenizer_config.json", "translation/Xenova/nllb-200-distilled-600M/tokenizer_config.json"]
  ]
];

if (download_models) {
  console.log("\nDownloading Models...");

  for (let model of model_file_urls) {
    // Download the model files
    for (let i = 1; i < model.length; i++) {
      const url = model[i];
      console.log(`Downloading: ${url[0]}`)
      downloadFile(url[0], `../dist/models/${url[1]}`);
    }

    // Create local chat specific file.
    fs.writeFile(`../dist/models/${model[0].path}/browser_config.json`, JSON.stringify(model[0]));
  }
}
