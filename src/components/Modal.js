import React from "react";

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div dir="rtl" className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        {/* כותרת המודל */}
        <div className="flex justify-between items-center border-b pb-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:bg-gray-100 p-2 rounded-full"
          >
            ✖️
          </button>
        </div>

        {/* תוכן המודל */}
        <div className="mb-4">{children}</div>

        {/* כפתורי פעולה */}
        <div className="flex justify-end space-x-4 gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200"
          >
            ביטול
          </button>
          <button
            onClick={() => alert("אישור בוצע!")}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            אישור
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
