import React from 'react';

export const Toast = ({ message }: { message: string }) => {
  return <div className="toast">{message}</div>;
};
