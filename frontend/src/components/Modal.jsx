import React from 'react';

export default function Modal({ show, onClose, title, children, footer, size = 'lg' }) {
  if (!show) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="modal-backdrop fade show" 
        style={{ zIndex: 1040 }}
        onClick={onClose}
      />
      {/* Modal */}
      <div 
        className="modal fade show" 
        style={{ display: 'block', zIndex: 1050 }} 
        tabIndex="-1" 
        role="dialog"
        onClick={onClose}
      >
        <div 
          className={`modal-dialog modal-${size}`} 
          role="document"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={onClose}
                aria-label="Close"
              />
            </div>
            <div className="modal-body">
              {children}
            </div>
            {footer && (
              <div className="modal-footer">
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
