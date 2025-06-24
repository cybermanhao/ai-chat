import React from 'react';
import './GlobalLoading.less';

const GlobalLoading: React.FC<{ visible: boolean }> = ({ visible }) => {
  if (!visible) return null;
  return (
    <div className="global-loading-mask">
      <div className="global-loading-spinner">
        <div className="spinner" />
        <div className="loading-text">载入中…</div>
      </div>
    </div>
  );
};

export default GlobalLoading;
