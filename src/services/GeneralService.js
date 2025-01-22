import axios from "axios";

// const BASE_URL = 'http://98.80.128.151:8000/api/v1/'
const BASE_URL='https://98.80.128.151:8443/api/v1/'

export const uploadFile = async (bucketName, fileKey, fileData) => {
    try {
        const response = await axios.post(`${BASE_URL}s3/upload`, {
            bucket_name: bucketName,
            file_key: fileKey,
            file_data: fileData
        }, { headers: { 'Content-Type': 'application/json' } });

        if (response && response.data) {
            if (response.data.status === "success") {
                return true;
            } else {
                throw new Error(`Upload failed: ${response.data.status} `);
            }
        }
        return false;
    } catch (error) {
        console.error('Error uploading file:', error.message);
        throw error;
    }
};

export const getFile = async (bucketName, fileKey) => {
    try {
        const response = await axios.post(`${BASE_URL}s3/get`, {
            bucket_name: bucketName,
            file_key: fileKey,
        }, { headers: { 'Content-Type': 'application/json' } });

        if (response && response.data) {
            if (response.data.status === "success") {
                const jsonData = response.data.file_content;
                const jsonObject = JSON.parse(jsonData); // המרה ל-Object
                const content = jsonObject.results.formatted_text;
                console.log('File fetched successfully:', response.data);
                return content; // data.file_content יכיל את תוכן הקובץ במידת הצורך
            }
            if (response.data.status === "error") {
                console.error(`Error fetching file: ${response.data.status} - ${response.data.message}`);
                throw new Error(`Fetch failed: ${response.data.status}`);
            }
        }
    } catch (error) {
        console.error('Error fetching file:', error.message);
        throw error;
    }
};

export const TranscribeFile = async (bucketName, fileName, filePath, lang, numSpeakers, endDir) => {
    try {
        const response = await axios.post(`${BASE_URL}transcribe`, {
            bucket_name: bucketName,//שם באקט
            file_key: filePath,//מיקום קובץ המקורי
            number_of_speakers: numSpeakers,
            language_code: lang,
            end_dir: endDir,//תקיה שבה ישב הקובץ המתומלל
            file_name: fileName,//שם קובץ המקורי
        }, { headers: { 'Content-Type': 'application/json' } });

        if (response && response.data) {
            if (response.data.status === "success") {
                console.log('File fetched successfully:', response.data);
                return response.data.job_name; // data.file_content יכיל את תוכן הקובץ במידת הצורך
            }
            if (response.data.status === "error") {
                console.error(`Error fetching file: ${response.data.status} `);
                throw new Error(`Fetch failed: ${response.data.status}`);
            }
        }
    } catch (error) {
        console.error('Error fetching file:', error.message);
        throw error;
    }
};
export const summarize = async (bucketName, fileKey = "", text = "") => {
    try {
        const response = await axios.post(`${BASE_URL}summarize`, {
            bucket_name: bucketName,
            file_key: fileKey,
            text: text
        }, { headers: { 'Content-Type': 'application/json' } });

        if (response && response.data) {
            if (response.data.status === "success") {
                return response.data.summarized_text;
            }
            if (response.data.status === "error") {
                console.error(`Error summarize file: ${response.data.status} `);
                throw new Error(`summarize failed: ${response.data.status}`);
            }
        }
    } catch (error) {
        console.error('Error summarize file:', error.message);
        throw error;
    }
};

export const cleanTranscribe = async (bucketName, transcription,fileName="", filePath="") => {
    var url = "";
    try {
       

        const response = await axios.post(`${BASE_URL}clean-transcription`, {
            bucket_name: bucketName,
            transcription:transcription,
            file_name:''
        }, { headers: { 'Content-Type': 'application/json' } });
        if (response && response.data) {
            if (response.data.status === "success") {
                return response.data.clean_text;
            }
            if (response.data.status === "error") {
                console.error(`Error summarize file: ${response.data.status} `);
                throw new Error(`summarize failed: ${response.data.status}`);
            }
        }
    } catch (error) {
        console.error('Error summarize file:', error.message);
        throw error;
    }
};

export const getDictionary = async () => {
    try {
        const response = await axios.get(`${BASE_URL}get-dictionary`, {
        }, { headers: { 'Content-Type': 'application/json' } });

        if (response && response.data) {
            if (response.data.status === "success") {
                return response.data.dictionary_content;
            }
            if (response.data.status === "error") {
                console.error(`Error summarize file: ${response.data.status} `);
                throw new Error(`summarize failed: ${response.data.status}`);
            }
        }
    } catch (error) {
        console.error('Error summarize file:', error.message);
        throw error;
    }
};

export const UploadDictionary = async (bucketName, dicArray) => {
    try {
        const response = await axios.post(`${BASE_URL}upload-dictionary`, {
            bucket_name: bucketName,
            dictionary_content: dicArray
        }, { headers: { 'Content-Type': 'application/json' } });

        if (response && response.data) {
            if (response.data.status === "success") {
                return true;
            }
            if (response.data.status === "error") {
                console.error(`Error UploadDictionary: ${response.data.status} `);
                throw new Error(`Update Dic failed: ${response.data.status}`);
            }
        }
    } catch (error) {
        console.error('Error update dic:', error.message);
        throw error;
    }
};
