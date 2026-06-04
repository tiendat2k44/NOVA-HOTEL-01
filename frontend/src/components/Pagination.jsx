import React from 'react';

export default function Pagination({ 
  currentPage, 
  totalPages, 
  totalItems, 
  pageSize, 
  onPageChange, 
  onPageSizeChange 
}) {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisible = 5;
  let start = Math.max(0, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages - 1, start + maxVisible - 1);
  if (end - start < maxVisible - 1) {
    start = Math.max(0, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="d-flex justify-content-between align-items-center mt-3">
      <div className="text-muted small">
        Hiển thị {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, totalItems)} / {totalItems}
      </div>

      <div className="d-flex align-items-center gap-2">
        <select 
          className="form-select form-select-sm" 
          style={{ width: 'auto' }}
          value={pageSize} 
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
          {[10, 20, 50, 100].map(s => (
            <option key={s} value={s}>{s} / trang</option>
          ))}
        </select>

        <nav>
          <ul className="pagination pagination-sm mb-0">
            <li className={`page-item ${currentPage === 0 ? 'disabled' : ''}`}>
              <button 
                className="page-link" 
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 0}
              >
                ‹
              </button>
            </li>

            {start > 0 && (
              <>
                <li className="page-item">
                  <button className="page-link" onClick={() => onPageChange(0)}>1</button>
                </li>
                {start > 1 && <li className="page-item disabled"><span className="page-link">...</span></li>}
              </>
            )}

            {pages.map(p => (
              <li key={p} className={`page-item ${p === currentPage ? 'active' : ''}`}>
                <button 
                  className="page-link" 
                  onClick={() => onPageChange(p)}
                >
                  {p + 1}
                </button>
              </li>
            ))}

            {end < totalPages - 1 && (
              <>
                {end < totalPages - 2 && <li className="page-item disabled"><span className="page-link">...</span></li>}
                <li className="page-item">
                  <button className="page-link" onClick={() => onPageChange(totalPages - 1)}>{totalPages}</button>
                </li>
              </>
            )}

            <li className={`page-item ${currentPage >= totalPages - 1 ? 'disabled' : ''}`}>
              <button 
                className="page-link" 
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
              >
                ›
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
