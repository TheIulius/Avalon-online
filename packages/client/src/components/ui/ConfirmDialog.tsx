import React from 'react';

export const ConfirmDialog = ({ message, onConfirm }: { message: string, onConfirm: () => void }) => {
  return (
    <div className="dialog">
      <p>{message}</p>
      <button onClick={onConfirm}>Confirm</button>
    </div>
  );
};
