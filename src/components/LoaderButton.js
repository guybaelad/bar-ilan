import React, { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";

const LoaderButton = ({ isLoading, onComplete }) => {
  const [progress, setProgress] = useState(); // אחוז התקדמות

  useEffect(() => {
    let interval = null;

    if (isLoading) {

      // אתחול פרוגרס ל-0
      setProgress(0);

      interval = setInterval(() => {
        setProgress((prev) => {
          console.log("prev=" + prev)
          const nextValue = prev + 1;

          // עדכון אחוזים
          if (nextValue < 95) {
            return nextValue;
          } else {
            clearInterval(interval); // סיום עדכון ברגע שהגענו ל-100%
            if (onComplete) onComplete(); // קריאה לפונקציה בסיום
            return 100; // הגדרת אחוזים 100% בסיום
          }
        });
      }, 1000); // עדכון כל 100ms (אחוז בכל 100ms)
    } else {
      
      clearInterval(interval); // ניקוי אינטרוול אם לא בטעינה
    }

    return () => clearInterval(interval); // ניקוי האינטרוול בזמן פריקה
  }, [isLoading, onComplete]);

  // הצגת קומפוננטה רק אם יש טעינה
  if (!isLoading) return null;

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
              טוען... {progress}% {/* הצגת רק אחוזים */}
            </div>
          </>
        )}
        {!isLoading && <span>לחץ להתחיל</span>}
      </button>
    </div>
  );
};

export default LoaderButton;
