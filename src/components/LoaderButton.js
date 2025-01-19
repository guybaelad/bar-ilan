import React, { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";

const LoaderButton = ({ maxSeconds, isLoading, onComplete }) => {
  const [secondsPassed, setSecondsPassed] = useState(0);

  useEffect(() => {
    let interval = null;

    if (isLoading) {
      // מתחיל את הטיימר
      setSecondsPassed(0);
      interval = setInterval(() => {
        setSecondsPassed((prev) => {
          const nextValue = prev + 1;
          if (nextValue >= maxSeconds) {
            clearInterval(interval);
            if (onComplete) onComplete(); // קורא לפונקציה כשמסתיים
          }
          return nextValue;
        });
      }, 1000); // אינטרוול של שנייה
    } else {
      clearInterval(interval);
    }

    return () => clearInterval(interval); // ניקוי האינטרוול בזמן פריקה
  }, [isLoading, maxSeconds, onComplete]);

  return (
    <div className="flex items-center justify-center gap-4 p-4">

    <button
      className="flex flex-col items-center justify-center rounded-full p-2 bg-[#007e41] text-white rounded-full hover:bg-[#007e4191] disabled:opacity-50 w-60"
      disabled={isLoading}
    >
      {isLoading && (
        <>
          <RotateCcw className="animate-spin" size={20} /> {/* אייקון מסתובב */}
          <div className="text-xs mt-1">
            טוען... ({secondsPassed}/{maxSeconds})
          </div>
        </>
      )}
      {!isLoading && <span>לחץ להתחיל</span>}
    </button>
    </div>
  );
};
// rounded-full px-6 py-2 bg-green-400 text-white text-center flex items-center justify-center gap-2
export default LoaderButton;
