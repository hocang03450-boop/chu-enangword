
import React from 'react';

interface SecurityWrapperProps {
  children: React.ReactNode;
}

/**
 * Tính năng bảo mật đã được gỡ bỏ theo yêu cầu của người dùng để hỗ trợ gỡ lỗi trên Vercel.
 */
export const SecurityWrapper: React.FC<SecurityWrapperProps> = ({ children }) => {
  return <>{children}</>;
};
