// Important information:

// The first model in each category is considered the baseline model.
// This is why the upload and inference times are listed as 1. 
// The reason for this is that it allows all other models, added or not yet added, to have a consistent baseline to compare to no matter what device is being used.
// To calculate the upload and inference times for each other model, the following should be done.

// 1. Benchmark the new model and the baseline model for the category type on the same device under the same circumstances.
// 2. Divide the average values for the new model by the average for the baseline model.

// The exact values from the division doesnt need to be used, only a rough approxamation due to slight differences in the average baseline model values on different devices.

// TODO: Decide if it might be better to have a range of upload and infer times due to device differences.

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
            quality: 7,
            devices: {
                "i7-12700F": {upload: 3.2, inference: 8.6}, 
            },
        },{
            name: "Xenova/distilbart-cnn-6-6",
            file_size: 0.272,
            quality: 7,
            devices: {
                "i7-12700F": {upload: 2, inference: 4.8}, 
            },
        },{
            name: "Xenova/distilbart-cnn-12-3",
            file_size: 0.296,
            quality: 8,
            devices: {
                "i7-12700F": {upload: 1.8, inference: 4.7}, 
            },
        },{
            name: "Xenova/distilbart-cnn-12-6",
            file_size: 0.345,
            quality: 7,
            devices: {
                "i7-12700F": {upload: 2.2, inference: 5.6}, 
            },
        },{
            name: "Xenova/distilbart-xsum-6-6",
            file_size: 0.272,
            quality: 2,
            devices: {
                "i7-12700F": {upload: 1.9, inference: 2.2}, 
            },
        },{
            name: "Xenova/distilbart-xsum-9-6",
            file_size: 0.309,
            quality: 3,
            devices: {
                "i7-12700F": {upload: 2.1, inference: 2.6}, 
            },
        },{
            name: "Xenova/distilbart-xsum-12-1",
            file_size: 0.264,
            quality: 2,
            devices: {
                "i7-12700F": {upload: 1.6, inference: 2.9}, 
            },
        },{
            name: "Xenova/distilbart-xsum-12-3",
            file_size: 0.296,
            quality: 4,
            devices: {
                "i7-12700F": {upload: 1.9, inference: 2.9}, 
            },
        },{
            name: "Xenova/distilbart-xsum-12-6",
            file_size: 0.345,
            quality: 1,
            devices: {
                "i7-12700F": {upload: 2.3, inference: 2.7}, 
            },
        },{
            name: "fcogidi/BARTxiv",
            file_size: 0.492,
            quality: 0,
            devices: {
                "i7-12700F": {upload: 4.7, inference: 11.2}, 
            },
        },{
            name: "ahmedaeb/distilbart-cnn-6-6-optimised",
            file_size: 0.321,
            quality: 7,
            devices: {
                "i7-12700F": {upload: 2.1, inference: 4.4}, 
            },
        }
    ],
    translation: [
        {
            name: "Xenova/nllb-200-distilled-600M",
            file_size: 0.896,
            quality: 9,    // TODO: need to find method for checking quality of outputs for other model types.
            devices: {
                "i7-12700F": {upload: 5.8, inference: 4.9}, 
                "i5-1135G7": {upload: 22.3, inference: 4.9}
            },
        },{
            name: "Xenova/mbart-large-50-many-to-many-mmt",
            file_size: 0.848,
            quality: 7,
            devices: {
                "i7-12700F": {upload: 5.2, inference: 4.8}, 
                "i5-1135G7": {upload: 16.7, inference: 6.5},
            },
        },{
            name: "Xenova/m2m100_418M",
            file_size: 0.61,
            quality: 8,
            devices: {
                "i7-12700F": {upload: 4.0, inference: 3.9}, 
                "i5-1135G7": {upload: 13.4, inference: 5.8},
            },
        }
    ],
    "question-answering": [
        {
            name: "Xenova/distilbert-base-cased-distilled-squad",
            file_size: 0.063,
            quality: 0,
            devices: {
                "i7-12700F": {upload: 0.3, inference: 0.5},
                "i5-1135G7": {upload: 0.8, inference: 0.5},
            },
        },{
            name: "Xenova/distilbert-base-uncased-distilled-squad",
            file_size: 0.064,
            quality: 0.5,
            devices: {
                "i7-12700F": {upload: 0.3, inference: 0.5}, 
            },
        },{
            name: "Xenova/tomasmcm/intel-dynamic-tinybert-onnx",
            file_size: 0.064,
            quality: 0.5,
            devices: {
                "i7-12700F": {upload: 0.4, inference: 0.6}, 
                "i5-1135G7": {upload: 0.9, inference: 0.5},
            },
        },{
            name: "Xenova/jestevesv/distilbert-base-spanish-uncased-finetuned-qa-mlqa-onnx",
            file_size: 0.064,
            quality: 0,
            devices: {
                "i7-12700F": {upload: 0.4, inference: 0.8}, 
            },
        },{
            name: "Xenova/onnx-community/bert-multi-english-german-squad2-ONNX",
            file_size: 0.172,
            quality: 0,
            devices: {
                "i7-12700F": {upload: 0.9, inference: 1.1}, 
            },
        },{
            name: "Xenova/onnx-community/mdeberta-ru-qa-ONNX",
            file_size: 0.302,
            quality: 0,
            devices: {
                "i7-12700F": {upload: 1.8, inference: 4.7}, 
            },
        },{
            name: "Xenova/onnx-community/xdoc-base-squad2.0-ONNX",
            file_size: 0.122,
            quality: 0.5,
            devices: {
                "i7-12700F": {upload: 0.7, inference: 1.0}, 
            },
        },{
            name: "Xenova/onnx-community/xlm-roberta-base-squad2-distilled-ONNX",
            file_size: 0.282,
            quality: 0.5,
            devices: {
                "i7-12700F": {upload: 1.4, inference: 1.4}, 
            },
        }
    ]
};



