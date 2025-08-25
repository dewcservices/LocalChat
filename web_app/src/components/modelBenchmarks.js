export const modelBenchmarks = {
    summarization: [
        {
            name: "model_name",
            file_size: "approximate file size in GB",
            upload_time: "average upload time in comparison to other models",
            infer_time: "average inference time in comparison to other models",
            quality: "",    // TODO: can use ROGUE to determine model quality of output. 
        },{
            name: "",
            file_size: "",
            upload_time: "",
            infer_time: "",
            quality: "",
        },{
            name: "",
            file_size: "",
            upload_time: "",
            infer_time: "",
            quality: "",
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
    question_awnsering: [
        {
            name: "",
            file_size: "",
            upload_time: "",
            infer_time: "",
            quality: "",
        }
    ]
};