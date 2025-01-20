const BASE_URL = 'http://98.80.128.151:8000/api/v1/'
//const BASE_URL='https://98.80.128.151:8443/api/'

export const uploadFile = async (bucketName, fileKey, fileData) => {
    return fetch(`${BASE_URL}s3/upload`, {
        mode: 'cors',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            bucket_name: bucketName,
            file_key: fileKey,
            file_data: fileData,
        }),
    })
        .then(async (response) => {
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Upload failed: ${response.status} `);
            }

        })
        .then(async (data) => {
            console.log(data)
            return true
        })
        .catch((error) => {
            console.error('Error uploading file:', error.message);
            throw error;
        });
};



export const getFile = async (bucketName, fileKey) => {
    return fetch(BASE_URL + `s3/get`, {
        mode: 'cors',
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        data: { body: JSON.stringify({ bucket_name: bucketName, file_key: fileKey, }), }
    })
        .then(async (response) => {
            if (!response.ok) {
                const errorData = await response.json();
                console.error(`Error get file: ${response.status} - ${response.message}`);
                throw new Error(`get file failed: ${response.status}`);
            }
            return response.json();
        })
        .then(async (data) => {
            const jsonData = await data.file_content;
            const jsonObject = JSON.parse(jsonData); // המרה ל-Object
            const content = jsonObject.results.formatted_text;
            console.log('File fetched successfully:', data);
            return content; // data.file_content יכיל את תוכן הקובץ במידת הצורך
        })
        .catch((error) => {
            console.error('Error fetching file:', error.message);
            throw error;
        });
};

export const TranscribeFile = async (bucketName, fileName, filePath, lang, numSpeakers, endDir) => {
    return fetch(BASE_URL + `transcribe`, {
        mode: 'cors',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            bucket_name: bucketName,//שם באקט
            file_key: filePath,//מיקום קובץ המקורי
            number_of_speakers: numSpeakers,
            language_code: lang,
            end_dir: endDir,//תקיה שבה ישב הקובץ המתומלל
            file_name: fileName,//שם קובץ המקורי

        }),
    })
        .then(async (response) => {
            if (!response.ok) {
                const errorData = await response.json();

                console.error(`Error fetching file: ${response.status} `);
                throw new Error(`Fetch failed: ${response.status}`);
            }
            return response;
        })
        .then(async (data) => {
            const responseData = await data.json()
            console.log('File fetched successfully:', data);

            return responseData.job_name; // data.file_content יכיל את תוכן הקובץ במידת הצורך
        })
        .catch((error) => {
            console.error('Error fetching file:', error.message);
            throw error;
        });
};

export const summarize = async (bucketName, fileKey = "", text = "") => {
    return fetch(BASE_URL + `summarize`, {
        mode: 'cors',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            bucket_name: bucketName,
            file_key: fileKey,
            text: text
        }),
    })
        .then(async (response) => {
            if (!response.ok) {
                const errorData = await response.json();
                console.error(`Error fetching file: ${response.status} - ${errorData.message}`);
                throw new Error(`Fetch failed: ${response.status}`);
            }
            return response;
        })
        .then(async (data) => {
            const jsonObject = await data.json();
            const content = jsonObject.summarized_text;
            return content;
        })
        .catch((error) => {
            console.error('Error fetching file:', error.message);
            throw error;
        });
};

export const cleanText = async (bucketName, dicKey, txt, txtFilePath) => {
    return fetch(BASE_URL + `summarize`, {
        mode: 'cors',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            bucket_name: bucketName,
            dictionary_key: dicKey,
            text: txt,
            text_file_path: txtFilePath
        }),
    })
        .then(async (response) => {
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Fetch failed: ${response.status}-${errorData.message}`);
            }
            return response.json();
        })
        .then(async (data) => {
            const jsonObject = JSON.parse(data); // המרה ל-Object
            const cleanedText = jsonObject.cleaned_text;
            return cleanedText;
        })
        .catch((error) => {
            console.error('Error fetching file:', error.message);
            throw error;
        });
};

export const transcribeWithDic = async (bucketName, fileKey, numberOfSpeakers, languageCode, endDir, dictionaryKey, dictionaryBucket) => {
    return fetch(BASE_URL + `transcribe`, {
        mode: 'cors',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            bucket_name: bucketName,
            file_key: fileKey,
            number_of_speakers: numberOfSpeakers,
            language_code: languageCode,
            end_dir: endDir,
            dictionary_key: dictionaryKey,
            dictionary_bucket: dictionaryBucket
        }),
    })
        .then(async (response) => {
            if (!response.ok) {
                const errorData = await response.json();
                console.error(`Error fetching file: ${response.status} - ${errorData.message}`);
                throw new Error(`Fetch failed: ${response.status}`);
            }
            return response.json();
        })
        .then(async (data) => {
            const jsonData = await data.file_content;
            const jsonObject = JSON.parse(jsonData); // המרה ל-Object
            const content = jsonObject.job_name;
            console.log('File fetched successfully:', data);
            return content; // data.file_content יכיל את תוכן הקובץ במידת הצורך
        })
        .catch((error) => {
            console.error('Error fetching file:', error.message);
            throw error;
        });
};

export const getDictionary = async () => {
    return fetch(BASE_URL + `get-dictionary`, {
        mode: 'cors',
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    })
        .then(async (response) => {
            if (!response.ok) {
                const errorData = await response.json();
                // console.error(`Error getDictionary : ${response.status} - ${response.message}`);
                throw new Error(`get Dictionary failed: ${response.status}`);
            }
            return response
        })
        .then(async (data) => {

            const jsonData = await data.json();

          
            console.log('File fetched successfully:', data);
            return jsonData.dictionary_content; 
        })
        .catch((error) => {
            console.error('Error fetching file:', error.message);
            throw error;
        });
};
