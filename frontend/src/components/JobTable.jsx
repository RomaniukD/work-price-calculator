import './JobTable.css';

const JobTable = ({ jobs, onDeleteJob }) => {
  const totalPrice = jobs.reduce((sum, job) => sum + job.finalPrice, 0);

  return (
    <div className="job-table-container">
      {jobs.length > 0 && (
        <>
          <div className="table-wrapper">
            <table className="job-table">
              <thead>
                <tr>
                  <th>Категорія</th>
                  <th>Підкатегорія</th>
                  <th>Робота</th>
                  <th>Ціна за одиницю</th>
                  <th>Об'єм/кількість</th>
                  <th>Кінцева ціна</th>
                  <th>Дія</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td>{job.categoryName}</td>
                    <td>{job.subcategoryName}</td>
                    <td>{job.taskName}</td>
                    <td>{job.price} ₴</td>
                    <td>{job.area}</td>
                    <td className="final-price">{job.finalPrice.toFixed(2)} ₴</td>
                    <td>
                      <button
                        className="btn-delete"
                        onClick={() => onDeleteJob(job.id)}
                      >
                        Видалити
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <div className="total-price">
              <strong>Загальна ціна:</strong>{' '}
              <span className="total-value">{totalPrice.toFixed(2)} ₴</span>
            </div>
          </div>
        </>
      )}
      {jobs.length === 0 && (
        <div className="empty-message">
          Таблиця порожня. Додайте першу роботу!
        </div>
      )}
    </div>
  );
};

export default JobTable;
