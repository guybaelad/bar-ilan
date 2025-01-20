import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

const AudioPlayer = props => {
  const { audioUrl, duration: durationCustom } = props;
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(durationCustom ? durationCustom : 0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState(null);
  const audioRef = useRef(null);

  console.log('duration', props)

  useEffect(() => {
    if (audioUrl) {
      loadAudioFromUrl(audioUrl);
    }
  }, [audioUrl]);

  const loadAudioFromUrl = (url) => {
    try {
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.load();
        setError(null);
      }
    } catch (err) {
      console.error("Error loading audio URL:", err);
      setError("Failed to load audio");
    }
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && !durationCustom) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReset = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  return (
      <div className="w-full bg-white rounded-lg shadow-sm p-4 mb-4">
        <audio
            ref={audioRef}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
        />

        {error ? (
            <div className="text-red-500 text-center py-2">
              {error}
            </div>
        ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-4">
                <button
                    onClick={handleReset}
                    className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                    disabled={!duration}
                >
                  <RotateCcw size={20} />
                </button>
                <button
                    onClick={togglePlayPause}
                    className="p-2 bg-[#007e41] text-white rounded-full hover:bg-[#007e4191] disabled:opacity-50 w-60"
                    disabled={!duration}
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>
              </div>

              <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 min-w-[40px]">
              {formatTime(currentTime)}
            </span>
                <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    disabled={!duration}
                />
                <span className="text-sm text-gray-600 min-w-[40px]">
              {formatTime(duration)}
            </span>
              </div>
            </div>
        )}
      </div>
  );
};

export default AudioPlayer;