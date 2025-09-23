import React from "react";
import { UserModel } from "@/types";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  user: UserModel;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  user
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4 text-black">Remove Contact</h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to remove <strong>{user.displayNameOrUsername}</strong> from your contacts?
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            style={{cursor: 'pointer'}}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{cursor: 'pointer'}}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;