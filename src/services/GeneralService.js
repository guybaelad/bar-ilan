




export const uploadFile = async (bucketName, fileKey, fileData) => {
    return fetch(`http://ec2-98-80-128-151.compute-1.amazonaws.com:8000/api/v1/s3/upload`, {
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
        //   throw new Error(`Upload failed: ${response.status} - ${errorData.message}`);
        console.log(errorData);
        }
        return response.json();
      })
      .then(async (response) => {
        const errorData = await response.json();

        console.log(`File uploaded successfully:${response.status} - ${errorData.message}`);
        return errorData;
      })
      .catch((error) => {
        console.error('Error uploading file:', error.message);
        throw error;
      });
  };
  
  export const getFile = async (bucketName, fileKey, fileData) => {
    return fetch(`http://ec2-98-80-128-151.compute-1.amazonaws.com:8000/api/v1/s3/get`, {
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
          console.error(`Error fetching file: ${response.status} - ${errorData.message}`);
          throw new Error(`Fetch failed: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log('File fetched successfully:', data);
        return data; // data.file_content יכיל את תוכן הקובץ במידת הצורך
      })
      .catch((error) => {
        console.error('Error fetching file:', error.message);
        throw error;
      });
  };

  

