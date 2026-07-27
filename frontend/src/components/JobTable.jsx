import './JobTable.css';

const getAmountUnit = (unit = '') => {
  if (!unit) return '';
  if (unit.includes('/')) return unit.split('/').slice(1).join('/').trim();

  return unit.replace(/^грн\s*/i, '').trim();
};

const formatPrice = (price, unit) => {
  const amountUnit = getAmountUnit(unit);

  return [`${price} ₴`, amountUnit ? `/ ${amountUnit}` : '']
    .filter(Boolean)
    .join(' ');
};

const formatAmount = (amount, unit) =>
  [amount, getAmountUnit(unit)].filter(Boolean).join(' ');

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
                  <th>Ціна</th>
                  <th>Об'єм/площа</th>
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
                    <td>{formatPrice(job.price, job.unit)}</td>
                    <td>{formatAmount(job.area, job.unit)}</td>
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
