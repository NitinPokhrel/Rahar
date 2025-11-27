const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  
    return (
      <div className="flex justify-center mt-4">
        <button 
          className="p-2" 
          disabled={currentPage === 1} 
          onClick={() => onPageChange(currentPage - 1)}
        >
          Prev
        </button>
  
        {pages.map(page => (
          <button 
            key={page} 
            className={`p-2 ${page === currentPage ? 'bg-blue-500 text-white' : ''}`} 
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}
  
        <button 
          className="p-2" 
          disabled={currentPage === totalPages} 
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </button>
      </div>
    );
  };
  
  export default Pagination;
  