import React, { useState, useRef, useEffect } from 'react';
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const TextDisplay = ({ text, sessionId, direction }) => {
  const [showCopy, setShowCopy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentText, setCurrentText] = useState(text);
  const [textType, setTextType] = useState('original');
  const contentRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setCurrentText(text);
  }, [text]);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [currentText]);

  const handleCopy = async () => {
    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = currentText;
      const textToCopy = tempDiv.textContent || tempDiv.innerText;

      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const fetchTextFromS3 = async (type) => {
    if (!sessionId) return;

    setIsLoading(true);
    setError('');

    const s3Client = new S3Client({
      region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY
      }
    });

    try {
      const key = type === 'cleaned' 
        ? `clean-texts/${sessionId}.json`
        : `ai-summaries/${sessionId}.json`;

      const command = new GetObjectCommand({
        Bucket: "product.transcriber",
        Key: key
      });

      const response = await s3Client.send(command);
      const reader = response.Body.getReader();
      const decoder = new TextDecoder('utf-8');
      let result = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value, { stream: true });
      }

      const data = JSON.parse(result);
      const processedText = type === 'cleaned' ? data.html : data.summary;
      setCurrentText(processedText?.split('\\n').join('\n') || '');
      setTextType(type);
    } catch (error) {
      console.error(`Error fetching ${type} text:`, error);
      setError(`Failed to load ${type} text`);
      setCurrentText(text);
      setTextType('original');
    } finally {
      setIsLoading(false);
    }
  };

  const baseClasses = "px-4 py-[4px] rounded-[8px] text-xs shadow-[0px_1px_2px_0px_rgba(0,0,0,.5)] hover:bg-slate-50 transition-all duration-300";
  
  return (
    <div className="relative">
      <div className="absolute top-0 left-0 right-0 h-12 flex justify-between items-center px-2 z-10 gap-2 bg-opacity-90">
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className={baseClasses}
            disabled={isLoading}
          >
            {copied ? (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                !הועתק
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <img src='/copy.svg' alt='copy' className='w-[15px] mr-2'/>
                העתק
              </span>
            )}
          </button>

          <button
            onClick={() => {
              if (textType === 'cleaned') {
                setCurrentText(text);
                setTextType('original');
              } else {
                fetchTextFromS3('cleaned');
              }
            }}
            className={baseClasses}
            disabled={isLoading}
          >
            טקסט מנוקה
          </button>

          <button
            onClick={() => {
              if (textType === 'summary') {
                setCurrentText(text);
                setTextType('original');
              } else {
                fetchTextFromS3('summary');
              }
            }}
            className={baseClasses}
            disabled={isLoading}
          >
            סיכום
          </button>
        </div>
      </div>

      <div className="group relative h-64 w-full overflow-hidden" style={{ resize: 'vertical' }}>
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-20">
              <img src='/loader.gif' alt='loader' className='w-32'/>
          </div>
        )}
        
        {error && (
          <div className="absolute top-14 left-2 right-2 text-red-500 text-center bg-red-100 p-2 z-20 rounded-lg">
            {error}
          </div>
        )}

        <div
          ref={contentRef}
          dangerouslySetInnerHTML={{ __html: currentText.replace(/\\n/g, '<br/>') }}
          className={`absolute inset-0 p-4 border-2 border-[#0f341e] rounded-lg focus:outline-none focus:border-blue-500 overflow-auto bg-white`}
          dir={direction}
          style={{
            whiteSpace: 'pre-wrap',
            marginTop: '3rem'
          }}
        />

        <div className="absolute bottom-2 right-2 w-6 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <img src='scale.svg' alt='↘️'/>
        </div>
      </div>
    </div>
  );
};

export default TextDisplay;