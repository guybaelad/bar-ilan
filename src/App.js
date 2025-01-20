import React, { useState, useRef, useCallback, useEffect } from 'react'
import {
  TranscribeStreamingClient,
  StartStreamTranscriptionCommand
} from '@aws-sdk/client-transcribe-streaming'
import { FetchHttpHandler } from '@aws-sdk/fetch-http-handler'
import { Buffer } from 'buffer'
import S3Service, { createSessionId } from './services/S3Service'
import { aiAgentClean, aiAgentSummary } from './services/AgentService'
import AudioPlayer from './services/AudioPlayer'
import DictionaryEditor from './services/DictionaryEditor'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import TextDisplay from './components/TextDisplay/TextDisplay'
import TranscriptionConfig from './components/TranscriptionConfig'
import { uploadFile, TranscribeFile, getFile, cleanText, summarize } from './services/GeneralService'
import LoaderButton from "./components/LoaderButton";
import Modal from "./components/Modal"

const MedicalTranscription = () => {
  const [isRecording, setIsRecording] = useState(false)
  const [transcription, setTranscription] = useState('')
  const [error, setError] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [transcribeFilePath, setTranscribeFilePath] = useState('')
  const [selectedFileName, setSelectedFileName] = useState('')
  const [isLoadingTranscription, setIsLoadingTranscription] = useState(false)
  const [fileContent, setFileContent] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fileInputRef = useRef(null)
  const [sessionId, setSessionId] = useState(null)
  const recordedChunksRef = useRef([])

  const partialTranscriptRef = useRef('')
  const completeTranscriptsRef = useRef([])
  const currentSpeakerRef = useRef(null)

  const mediaRecorderRef = useRef(null)
  const audioContextRef = useRef(null)
  const workletNodeRef = useRef(null)
  const streamRef = useRef(null)
  const gainNodeRef = useRef(null)
  const analyserRef = useRef(null)
  const animationFrameRef = useRef(null)

  const [isProcessingAI, setIsProcessingAI] = useState(false)

  const [numSpeakers, setNumSpeakers] = useState(2)
  const [language, setLanguage] = useState('he-IL')
  const [base64String, setBase64String] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const BUCKET_NAME = 'testtranscriberapp'
  const END_DIR_FOLDER = 'ai-summarize/'
  const TRANSCRIPTION_FOLDER = 'transcriptions/'
  const CLEANED_FOLDER = 'cleaned/'
  const MEDIA_LOAD_FOLDER = 'media-loads/'
  const SUMMARIZE_FOLDER = 'summarize/'
  const DICTIONARY_FOLDER = 'dictionaries/'
  var globalfile = ""

  useEffect(() => {
    if (error != '') {
      setIsLoading(false); // אם יש שגיאה, הפסיקי את הטעינה
    }
  }, [error]);
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleCleanText = async () => {
    // if (!sessionId) {
    //   setError('No active session')
    //   return
    // }

    try {
      setIsProcessingAI(true)

      // Create a progress handler
      const handleProgress = progressText => {
        setTranscription(progressText)
      }
      //const response = await cleanText(BUCKET_NAME,)

      openModal()
      //  await aiAgentClean(sessionId, handleProgress)
    } catch (error) {
      console.error('Error cleaning text:', error)
      setError('שגיאה בניקוי הטקסט')
    } finally {
      setIsProcessingAI(false)
    }
  }

  const fileToBase64_new = (file) => {
    return new Promise((resolve, reject) => {
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(',')[1];
          return base64;
        };
        reader.readAsDataURL(file);
      }
    })
  };
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file); // קריאת הקובץ
      reader.onload = () => resolve(reader.result.split(',')[1]); // מחרוזת Base64 (ללא header)
      reader.onerror = (error) => reject(error);
    });
  };



  const handleAISummary = async () => {
    // if (!sessionId) {
    //   setError('No active session')
    //   return
    // }

    try {
      // setIsProcessingAI(true)
      setIsLoading(true)
      //Create a progress handler
      const handleProgress = progressText => {
        setTranscription(progressText)
      }
      if (transcription == '') {
        setError('יש לטעון קובץ לסיכום')
        return;
      }
      debugger;
      const response = await summarize(BUCKET_NAME, '', transcription);
      setTranscription(response)
      setIsLoading(false);

    } catch (error) {
      console.error('Error generating summary:', error)
      setError('שגיאה ביצירת סיכום')
    } finally {
      setIsProcessingAI(false)
    }
  }

  const loadTranscription = async sessionId => {
    setIsLoadingTranscription(true)
    setError('')

    try {
      let attempts = 0
      const maxAttempts = 120 // 4 minute total (2 second intervals)
      const pollInterval = 2000

      const pollForTranscription = async () => {
        try {
          const transcriptionText = await S3Service.getFirstTranscription(
            sessionId
          )

          if (transcriptionText) {
            setTranscription(transcriptionText)
            return true
          }
          return false
        } catch (error) {
          console.log('Polling attempt failed:', error)
          return false
        }
      }

      const poll = async () => {
        if (attempts >= maxAttempts) {
          throw new Error('Timeout waiting for transcription')
        }

        console.log(
          `Polling attempt ${attempts + 1
          }/${maxAttempts} for session ${sessionId}`
        )
        const found = await pollForTranscription()
        if (!found) {
          attempts++
          await new Promise(resolve => setTimeout(resolve, pollInterval))
          return poll()
        }
      }

      await poll()
    } catch (error) {
      console.error('Error loading transcription:', error)
      setError(`Failed to load transcription: ${error.message}`)
    } finally {
      setIsLoadingTranscription(false)
    }
  }

  const setContentFile = async (file) => {
    try {
      if (file) {
        const reader = new FileReader();
        // פונקציה שתרוץ כשהקריאה של הקובץ הושלמה
        reader.onload = () => {
          // setFileContent(reader.result); // גישה לתוכן הקובץ
          setTranscription(reader.result); // גישה לתוכן הקובץ
        };
        // קריאה של תוכן הקובץ כטקסט
        reader.readAsText(file)
        // אפשר לשלוח את האובייקט `file` למקום אחר
      } else {
        console.log('No file selected');
      }
    }
    catch (error) {

    }
  };




  const handleFileSelect = async event => {
    debugger;
    const file = event.target.files[0]
    if (!file) return

    // List of supported audio MIME types including all MPEG variations
    const supportedAudioTypes = [
      'audio/mpeg', // MP3/MPEG files
      'audio/x-mpeg', // Alternative MPEG MIME type
      'video/mpeg', // MPEG files sometimes use video MIME type
      'audio/mpeg3', // Alternative MPEG3 MIME type
      'audio/x-mpeg3', // Alternative MPEG3 MIME type
      'audio/mp3', // MP3 files
      'audio/x-mp3', // Alternative MP3 MIME type
      'audio/mp4', // M4A files
      'audio/wav', // WAV files
      'audio/x-wav', // Alternative WAV MIME type
      'audio/webm', // WebM audio
      'audio/ogg', // OGG files
      'audio/aac', // AAC files
      'audio/x-m4a', // Alternative M4A MIME type
      'text/plain'
    ]

    // Check if file type is directly supported
    let isSupported = supportedAudioTypes.includes(file.type)

    // If not directly supported, check file extension for .mpeg files
    if (!isSupported && file.name) {
      const extension = file.name.toLowerCase().split('.').pop()
      if (extension === 'mpeg') {
        isSupported = true
      }
    }

    if (!isSupported) {
      setError(
        'Please select a supported audio file (MPEG, MP3, WAV, M4A, WebM, OGG, AAC,TXT)'
      )
      return
    }

    setSelectedFileName(file.name)
    // setUploadingFile(true)
    setError('')
    if (file.type === 'text/plain') {
      await setContentFile(file)
      setIsLoading(false);

    }
    else {

      try {
        //  const newSessionId = createSessionId()
        //  setSessionId(newSessionId)
        setIsLoading(true);


        // Log file information for debugging
        console.log('Uploading file:', {
          name: file.name,
          type: file.type,
          size: file.size,
          extension: file.name.split('.').pop()
        })

        var fileName = MEDIA_LOAD_FOLDER + file.name
        fileName = fileName.substring(0, fileName.lastIndexOf('.'));
        const fileBase64 = await fileToBase64(file) // הפיכת הקובץ ל-Base64
        const response = await uploadFile(BUCKET_NAME, fileName, fileBase64)
        if (response) {
          const res = await TranscribeFile(BUCKET_NAME, '', fileName, language, numSpeakers, TRANSCRIPTION_FOLDER)
          if (res) {
            setTranscribeFilePath(TRANSCRIPTION_FOLDER + res + '.json')
            const response = await getFile(BUCKET_NAME, TRANSCRIPTION_FOLDER + res + '.json')
            if (response) {
              setTranscription(response)
            }
          }
        }
        // setUploadingFile(false)
        setIsLoading(false);

        // Upload file to S3
        //await S3Service.uploadMedia(file, newSessionId)

        // Clear file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }

        setSelectedFileName(`Uploaded: ${file.name}`)
        // console.log('Starting transcription polling for session:', newSessionId)

        // Start loading the transcription
        // await loadTranscription(newSessionId)
      } catch (error) {
        console.error('Error handling file:', error)
        setError('Failed to process file: ' + error.message)
      } finally {
        setUploadingFile(false)
      }
    }
  }

  const transcribeClient = new TranscribeStreamingClient({
    region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY
    },
    requestHandler: {
      ...new FetchHttpHandler({
        requestTimeout: 600000
      }),
      metadata: {
        handlerProtocol: 'h2'
      }
    },
    extraRequestOptions: {
      duplex: 'half'
    }
  })

  const initializeAudioContext = useCallback(async () => {
    try {
      console.log('Initializing audio context...')
      if (!audioContextRef.current) {
        const context = new AudioContext({
          sampleRate: 16000,
          latencyHint: 'interactive'
        })

        // Create gain node
        gainNodeRef.current = context.createGain()
        gainNodeRef.current.gain.value = 5.0

        // Create analyser node
        analyserRef.current = context.createAnalyser()
        analyserRef.current.fftSize = 2048

        await context.audioWorklet.addModule('/audio-processor.js')
        audioContextRef.current = context

        console.log('Audio context initialized with gain and analyser')
      }
      return true
    } catch (error) {
      console.error('Audio initialization error:', error)
      setError('Failed to initialize audio: ' + error.message)
      return false
    }
  }, [])

  const startTranscription = useCallback(
    async stream => {
      let isStreaming = true
      const audioQueue = []
      let accumulatedBytes = 0
      let queueInterval

      try {
        const source = audioContextRef.current.createMediaStreamSource(stream)
        workletNodeRef.current = new AudioWorkletNode(
          audioContextRef.current,
          'audio-processor'
        )

        source.connect(workletNodeRef.current)

        workletNodeRef.current.port.onmessage = event => {
          if (event.data.audioData) {
            const audioData = event.data.audioData
            const stats = event.data.stats

            const buffer = Buffer.allocUnsafe(audioData.length * 2)
            for (let i = 0; i < audioData.length; i++) {
              buffer.writeInt16LE(audioData[i], i * 2)
            }

            if (stats.activeFrames > 0) {
              audioQueue.push(buffer)
            }

            setAudioLevel(Math.min(100, event.data.rms * 200))
          }
        }

        const audioStream = new ReadableStream({
          start(controller) {
            queueInterval = setInterval(() => {
              if (!isStreaming) {
                controller.close()
                return
              }

              if (audioQueue.length > 0) {
                const chunk = audioQueue.shift()
                controller.enqueue(chunk)
                accumulatedBytes += chunk.length
              }
            }, 5) // Reduced interval for faster processing
          },
          cancel() {
            isStreaming = false
            clearInterval(queueInterval)
          }
        })

        const command = new StartStreamTranscriptionCommand({
          LanguageCode: language,
          MediaEncoding: 'pcm',
          MediaSampleRateHertz: 16000,
          EnableSpeakerIdentification: numSpeakers > 1,
          NumberOfParticipants: numSpeakers,
          ShowSpeakerLabel: numSpeakers > 1,
          EnablePartialResultsStabilization: true,
          PartialResultsStability: 'low',
          VocabularyName: 'transcriber-he-punctuation',
          AudioStream: (async function* () {
            const reader = audioStream.getReader()
            try {
              while (true) {
                const { done, value } = await reader.read()
                if (done) break
                if (value) {
                  yield { AudioEvent: { AudioChunk: value } }
                }
              }
            } finally {
              reader.releaseLock()
            }
          })()
        })

        const response = await transcribeClient.send(command)

        // Initialize state with more efficient handling
        let currentTranscript = ''
        let lastPartialTimestamp = Date.now()
        completeTranscriptsRef.current = []

        for await (const event of response.TranscriptResultStream) {
          if (event.TranscriptEvent?.Transcript?.Results?.[0]) {
            const result = event.TranscriptEvent.Transcript.Results[0]

            if (result.Alternatives?.[0]) {
              const alternative = result.Alternatives[0]
              const newText = alternative.Transcript || ''

              // Handle speaker labels
              let speakerLabel = ''
              if (numSpeakers > 1) {
                if (alternative.Items?.length > 0) {
                  const speakerItem = alternative.Items.find(
                    item => item.Speaker
                  )
                  if (speakerItem) {
                    speakerLabel = `[דובר ${speakerItem.Speaker}]: `
                  }
                } else if (result.Speaker) {
                  speakerLabel = `[דובר ${result.Speaker}]: `
                }
              }

              // Update partial results more frequently
              const now = Date.now()
              const shouldUpdatePartial = now - lastPartialTimestamp > 100 // Update every 100ms

              if (result.IsPartial) {
                if (shouldUpdatePartial) {
                  currentTranscript = newText
                  lastPartialTimestamp = now

                  // Immediately update UI with partial result
                  const displayText = [
                    ...completeTranscriptsRef.current,
                    speakerLabel + currentTranscript
                  ]
                    .filter(Boolean)
                    .join('\n')

                  setTranscription(displayText)
                }
              } else {
                // For final results
                completeTranscriptsRef.current.push(speakerLabel + newText)
                currentTranscript = '' // Reset current transcript

                // Always update UI immediately for final results
                const displayText = completeTranscriptsRef.current.join('\n')
                setTranscription(displayText)
              }
            }
          }
        }
      } catch (error) {
        console.error('Transcription error:', error)
        throw error
      } finally {
        clearInterval(queueInterval)
      }
    },
    [isRecording, language, numSpeakers]
  )

  const startRecording = async () => {
    console.log('Starting recording...')
    setError('')
    setIsProcessing(true)

    try {
      const initialized = await initializeAudioContext()
      if (!initialized) return

      // Generate new session ID
      const newSessionId = createSessionId()
      setSessionId(newSessionId)
      recordedChunksRef.current = []

      console.log('Requesting microphone access...')
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 16000
        }
      })

      // Create MediaRecorder to save the audio
      mediaRecorderRef.current = new MediaRecorder(stream)
      mediaRecorderRef.current.ondataavailable = event => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }
      mediaRecorderRef.current.start()

      streamRef.current = stream
      setIsRecording(true)
      await startTranscription(stream)
    } catch (error) {
      console.error('Recording error:', error)
      // setError('Failed to start recording: ' + error.message); // Show error in console
    } finally {
      setIsProcessing(false)
    }
  }

  const clearTranscription = () => {
    // Refresh the page
    window.location.reload()
  }

  const stopRecording = useCallback(async () => {
    console.log('Stopping recording...')
    setIsRecording(false)
    setIsProcessing(true)

    try {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== 'inactive'
      ) {
        mediaRecorderRef.current.stop()
        await new Promise(resolve => {
          mediaRecorderRef.current.onstop = resolve
        })
      }

      // Create audio blob from recorded chunks
      if (recordedChunksRef.current.length > 0) {
        const audioBlob = new Blob(recordedChunksRef.current, {
          type: 'audio/wav'
        })

        // Upload recording to S3
        await S3Service.uploadRecording(audioBlob, sessionId)

        // Upload transcription to S3
        await S3Service.uploadTranscription(transcription, sessionId)

        console.log('Successfully saved recording and transcription')
      }
    } catch (error) {
      console.error('Error saving recording:', error)
      setError('Failed to save recording: ' + error.message)
    } finally {
      // Clean up resources
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }

      if (workletNodeRef.current) {
        workletNodeRef.current.disconnect()
        workletNodeRef.current = null
      }

      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect()
        gainNodeRef.current = null
      }

      if (analyserRef.current) {
        analyserRef.current.disconnect()
        analyserRef.current = null
      }

      if (audioContextRef.current?.state === 'running') {
        audioContextRef.current.close()
        audioContextRef.current = null
      }

      mediaRecorderRef.current = null
      recordedChunksRef.current = []
      setAudioLevel(0)
      setIsProcessing(false)
    }
  }, [sessionId, transcription])

  return (
    <div className='min-h-screen'>
      <div className='w-full h-[100px] bg-[#014127]'>
        <img src='/logo.svg' alt='logo' className='h-[100%] ml-auto' />
      </div>

      <div className='mx-auto max-w-[1000px] rounded-xl px-8 py-6'>
        <div className='flex justify-end items-center pb-4 mb-6'>
          <h1 className='text-2xl md:text-3xl text-[#006937] font-bold text-right font-assistant'>
            מערכת תמלול חכמה
          </h1>
        </div>

        {error && (
          <div
            className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-right'
            role='alert'
          >
            <span className='block sm:inline'>{error}</span>
          </div>
        )}

        <TranscriptionConfig
          numSpeakers={numSpeakers}
          setNumSpeakers={setNumSpeakers}
          language={language}
          setLanguage={setLanguage}
          disabled={isRecording || isProcessing || uploadingFile}
        />

        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#0069361e] rounded-lg mb-2'>
          <button
            onClick={stopRecording}
            disabled={!isRecording}
            className='btn-primary'
          >
            <span className='ml-6'>סיום הקלטה</span>
            <img src='/stop.svg' alt='⏹️' />
          </button>
          <button
            onClick={startRecording}
            disabled={isRecording || isProcessing || uploadingFile}
            className='btn-primary relative'
          >
            {isProcessing ? (
              <span className='flex items-center justify-center'>
                <svg className='animate-spin h-5 w-5 mr-3' viewBox='0 0 24 24'>
                  <circle
                    className='opacity-25'
                    cx='12'
                    cy='12'
                    r='10'
                    stroke='currentColor'
                    strokeWidth='4'
                    fill='none'
                  />
                  <path
                    className='opacity-75'
                    fill='currentColor'
                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                  />
                </svg>
                ...מתחיל
              </span>
            ) : (
              <span className='ml-6'>התחל הקלטה</span>
            )}
            {!isProcessing && <img src='/play.svg' alt='▶️' />}
          </button>

          <button onClick={clearTranscription} className='btn-primary'>
            <span className='ml-6'>תמלול חדש</span>
            <img src='/new.svg' alt='➕' />
          </button>
          <div className='relative'>
            <input
              type='file'
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept='audio/*,text/plain'
              className='hidden'
              id='file-upload'
            />
            <label
              htmlFor='file-upload'
              className={`btn-primary w-full flex items-center justify-center cursor-pointer ${uploadingFile ? 'opacity-50 cursor-not-allowed' : ''
                }`}
            >
              {uploadingFile ? (
                <span className='flex items-center'>
                  <svg
                    className='animate-spin h-5 w-5 ml-3'
                    viewBox='0 0 24 24'
                  >
                    <circle
                      className='opacity-25'
                      cx='12'
                      cy='12'
                      r='10'
                      stroke='currentColor'
                      strokeWidth='4'
                      fill='none'
                    />
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                    />
                  </svg>
                  מעלה...
                </span>
              ) : (
                <span className='ml-6'>העלאת קובץ</span>
              )}
              <img src='/upload.svg' alt='⬆️' />
            </label>
            {selectedFileName && (
              <p className='text-sm text-gray-600 mt-2 text-right break-words'>
                {selectedFileName}
              </p>
            )}
          </div>
        </div>

        {isRecording && (
          <div className='mb-4'>
            <div className='w-full bg-gray-200 rounded-full h-2.5'>
              <div
                className='bg-[#007e41] h-2.5 rounded-full transition-all duration-200'
                style={{ width: `${Math.min(100, audioLevel)}%` }}
              />
            </div>
            <p className='text-sm text-gray-500 mt-1 text-right'>
              רמת קול: {Math.round(audioLevel)}
            </p>
          </div>
        )}
        {isLoading && (
          <LoaderButton
            maxSeconds={30}
            isLoading={isLoading}
          />)}
        {sessionId && !isRecording && (
          <AudioPlayer
            sessionId={sessionId}
            recordingType={selectedFileName ? 'upload' : 'recording'}
          />
        )}

        {/* AI Processing Controls */}
        <div className='flex flex-row flex-wrap items-center justify-center gap-6 bg-[#00693609] rounded-md mb-20'>
          <button
            onClick={handleCleanText}
            disabled={!transcription || isProcessingAI}
            className={`btn-secondary ${!transcription || isProcessingAI
              ? 'opacity-50 cursor-not-allowed'
              : ''
              }`}
          >
            {isProcessingAI ? (
              <span className='flex items-center justify-center'>
                <svg className='animate-spin h-5 w-5 mr-3' viewBox='0 0 24 24'>
                  <circle
                    className='opacity-25'
                    cx='12'
                    cy='12'
                    r='10'
                    stroke='currentColor'
                    strokeWidth='4'
                    fill='none'
                  />
                  <path
                    className='opacity-75'
                    fill='currentColor'
                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                  />
                </svg>
                מעבד...
              </span>
            ) : (
              <div className='flex items-center flex-row-reverse gap-10'>
                <span>טיוב טקסט</span>
                {/* <img src='/trash.svg' alt='🧹' /> */}
              </div>
            )}
          </button>
          <button
            onClick={handleAISummary}
            disabled={!transcription || isProcessingAI}
            className={`btn-secondary ${!transcription || isProcessingAI
              ? 'opacity-50 cursor-not-allowed'
              : ''
              }`}
          >
            {isProcessingAI ? (
              <span className='flex items-center justify-center'>
                <svg className='animate-spin h-5 w-5 mr-3' viewBox='0 0 24 24'>
                  <circle
                    className='opacity-25'
                    cx='12'
                    cy='12'
                    r='10'
                    stroke='currentColor'
                    strokeWidth='4'
                    fill='none'
                  />
                  <path
                    className='opacity-75'
                    fill='currentColor'
                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                  />
                </svg>
                מעבד...
              </span>
            ) : (
              <div className='flex items-center flex-row-reverse gap-10'>
                <span>AI סיכום</span>
                <img src='/pc.svg' alt='🤖' />
              </div>
            )}
          </button>
          <DictionaryEditor />
        </div>

        <div className='space-y-4'>
          <TextDisplay
            text={transcription}
            sessionId={sessionId}
            direction={language === 'he-IL' || language === 'ar-AE' ? 'rtl' : 'ltr'}
          />
        </div>
        <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="האם ברצונך לשלוח את הטיוב למייל?"
      >
        <p>הזן כתובת מייל</p>
        <input class="w-full appearance-none rounded-md border border-gray-300 bg-white px-4 py-2 text-right text-gray-700 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200" type="email"  placeholder="example@domain.com" ></input>
      </Modal>
      </div>
    </div>
  )
}

export default MedicalTranscription
