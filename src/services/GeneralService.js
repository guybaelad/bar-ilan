import axios from "axios";

const BASE_URL='http://98.80.128.151:8000/api/v1/'
// const BASE_URL='https://98.80.128.151:8443/api/'

export const uploadFile = async (bucketName, fileKey, fileData) => {
  try {
    const response = await axios.post(`${BASE_URL}s3/upload`, {
      bucket_name: bucketName,
      file_key: fileKey,
      file_data: fileData
    }, {headers: {'Content-Type': 'application/json'}});

    if (response && response.data){
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
}};

export const getFile = async (bucketName, fileKey) => {
  try {
    const response = await axios.post(`${BASE_URL}s3/get`, {
      bucket_name: bucketName,
      file_key: fileKey,
    }, { headers: { 'Content-Type': 'application/json' }});

    if(response && response.data) {
      if(response.data.status === "success") {
        const jsonData = response.data.file_content;
        const jsonObject = JSON.parse(jsonData); // המרה ל-Object
        const content = jsonObject.results.formatted_text;
        console.log('File fetched successfully:', response.data);
        return content; // data.file_content יכיל את תוכן הקובץ במידת הצורך
      }
      if(response.data.status === "error"){
        console.error(`Error fetching file: ${response.data.status} - ${response.data.message}`);
        throw new Error(`Fetch failed: ${response.data.status}`);
      }
    }
  } catch (error) {
    console.error('Error fetching file:', error.message);
    throw error;
  }
};

export const TranscribeFile = async (bucketName, fileName,filePath ,lang,numSpeakers,endDir ) => {
  try {
    const response = await axios.post(`${BASE_URL}transcribe`, {
      bucket_name: bucketName,//שם באקט
      file_key: filePath,//מיקום קובץ המקורי
      number_of_speakers: numSpeakers,
      language_code: lang,
      end_dir: endDir,//תקיה שבה ישב הקובץ המתומלל
      file_name: fileName,//שם קובץ המקורי
    }, {headers: {'Content-Type': 'application/json'}});

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
