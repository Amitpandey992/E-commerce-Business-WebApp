import React from "react";

interface ConfirmPopupProps {
    isOpen: boolean;
    title: string;
    message?: string;
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
}

const ConfirmPopup: React.FC<ConfirmPopupProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    loading,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-11/12 sm:w-96 transform transition-all">
                <h2 className="text-lg font-semibold mb-3 text-gray-800">
                    {title}
                </h2>
                {message && <p className="text-gray-600 mb-6">{message}</p>}

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-100 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmPopup;
