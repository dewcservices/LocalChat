// Important information:

// The first model in each category is considered the baseline model.
// This is why the upload and inference times are listed as 1. 
// The reason for this is that it allows all other models, added or not yet added, to have a consistent baseline to compare to no matter what device is being used.
// To calculate the upload and inference times for each other model, the following should be done.

// 1. Benchmark the new model and the baseline model for the category type on the same device under the same circumstances.
// 2. Divide the average values for the new model by the average for the baseline model.

// The exact values from the division doesnt need to be used, only a rough approxamation due to slight differences in the average baseline model values on different devices.

export const modelBenchmarks = {

    // name: "model_name",
    // file_size: "approximate file size in GB",
    // upload_time: "average upload time in comparison to other models",
    // infer_time: "average inference time in comparison to other models",
    // quality: "",             // TODO: can use ROGUE to determine model quality of output, currently an estimated value is being used.

    summarization: [
        {
            // Baseline model
            name: "Xenova/bart-large-cnn",
            file_size: 0.443,
            upload_time: 1,
            infer_time: 1,
            quality: 7,
            estimate_upload_time_run_counts: [25000, 20000],
            estimate_generate_time_run_counts: [40000, 34000],
        },{
            name: "Xenova/distilbart-cnn-6-6",
            file_size: 0.272,
            upload_time: 0.64,
            infer_time: 0.55,
            quality: 7,
        },{
            name: "Xenova/distilbart-cnn-12-3",
            file_size: 0.296,
            upload_time: 0.57,
            infer_time: 0.54,
            quality: 8,
        },{
            name: "Xenova/distilbart-cnn-12-6",
            file_size: 0.345,
            upload_time: 0.71,
            infer_time: 0.65,
            quality: 7,
        },{
            name: "Xenova/distilbart-xsum-6-6",
            file_size: 0.272,
            upload_time: 0.61,
            infer_time: 0.26,
            quality: 2,
        },{
            name: "Xenova/distilbart-xsum-9-6",
            file_size: 0.309,
            upload_time: 0.66,
            infer_time: 0.3,
            quality: 3,
        },{
            name: "Xenova/distilbart-xsum-12-1",
            file_size: 0.264,
            upload_time: 0.5,
            infer_time: 0.33,
            quality: 2,
        },{
            name: "Xenova/distilbart-xsum-12-3",
            file_size: 0.296,
            upload_time: 0.59,
            infer_time: 0.33,
            quality: 4,
        },{
            name: "Xenova/distilbart-xsum-12-6",
            file_size: 0.345,
            upload_time: 0.73,
            infer_time: 0.31,
            quality: 1,
        },{
            name: "Mozilla/distilbart-cnn-12-6",
            file_size: 0.004,
            upload_time: 15.3,
            infer_time: 0.64,
            quality: 7,
        },{
            name: "fcogidi/BARTxiv",
            file_size: 0.492,
            upload_time: 1.47,
            infer_time: 1.29,
            quality: 0,
        },{
            name: "ahmedaeb/distilbart-cnn-6-6-optimised",
            file_size: 0.321,
            upload_time: 0.67,
            infer_time: 0.5,
            quality: 7,
        }
    ],
    translation: [
        {
            name: "",
            file_size: "",
            upload_time: "",
            infer_time: "",
            quality: "",    // TODO: need to find method for checking quality of outputs for other model types.
        }
    ],
    "question-answering": [
        {
            // Baseline Model
            name: "Xenova/distilbert-base-cased-distilled-squad",
            file_size: 0.063,
            upload_time: 1,
            infer_time: 1,
            quality: 0,
        },{
            name: "Xenova/distilbert-base-uncased-distilled-squad",
            file_size: 0.064,
            upload_time: 0.95,
            infer_time: 1,
            quality: 0.5,
        },{
            name: "Xenova/tomasmcm/intel-dynamic-tinybert-onnx",
            file_size: 0.064,
            upload_time: 1.15,
            infer_time: 1.1,
            quality: 0.5,
        },{
            name: "Xenova/jestevesv/distilbert-base-spanish-uncased-finetuned-qa-mlqa-onnx",
            file_size: 0.064,
            upload_time: 1.15,
            infer_time: 1.5,
            quality: 0,
        },{
            name: "Xenova/onnx-community/bert-multi-english-german-squad2-ONNX",
            file_size: 0.172,
            upload_time: 2.6,
            infer_time: 2,
            quality: 0,
        },{
            name: "Xenova/onnx-community/mdeberta-ru-qa-ONNX",
            file_size: 0.302,
            upload_time: 5.4,
            infer_time: 8.7,
            quality: 0,
        },{
            name: "Xenova/onnx-community/xdoc-base-squad2.0-ONNX",
            file_size: 0.122,
            upload_time: 2.1,
            infer_time: 2.3,
            quality: 0.5,
        },{
            name: "Xenova/onnx-community/xlm-roberta-base-squad2-distilled-ONNX",
            file_size: 0.282,
            upload_time: 5,
            infer_time: 4,
            quality: 0.5,
        }
    ]
};



