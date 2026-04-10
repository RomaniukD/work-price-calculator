import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import JobForm from './JobForm';
import JobTable from './JobTable';
import { fetchCategories } from '../services/api';
import './PriceCalculator.css';

const PriceCalculator = () => {
  const [categories, setCategories] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const tableRef = useRef(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchCategories();
        setCategories(data);
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  const handleAddJob = (jobData) => {
    setJobs([...jobs, jobData]);
  };

  const handleDeleteJob = (jobId) => {
    setJobs(jobs.filter(job => job.id !== jobId));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    if (!tableRef.current) return;

    try {
      // Hide delete buttons and "Дія" column for PDF
      const deleteButtons = tableRef.current.querySelectorAll('.btn-delete');
      const actionHeaderCell = tableRef.current.querySelector('th:nth-child(7)');
      const actionDataCells = tableRef.current.querySelectorAll('td:nth-child(7)');
      
      deleteButtons.forEach(btn => btn.style.display = 'none');
      if (actionHeaderCell) actionHeaderCell.style.display = 'none';
      actionDataCells.forEach(cell => cell.style.display = 'none');

      const canvas = await html2canvas(tableRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });

      // Show elements again
      deleteButtons.forEach(btn => btn.style.display = 'block');
      if (actionHeaderCell) actionHeaderCell.style.display = '';
      actionDataCells.forEach(cell => cell.style.display = '');

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 280;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);

      const totalPrice = jobs.reduce((sum, job) => sum + job.finalPrice, 0);
      pdf.setFontSize(12);
      pdf.text(`Загальна ціна: ${totalPrice.toFixed(2)} ₴`, 10, pdf.internal.pageSize.height - 10);

      pdf.save('jobs-list.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Помилка при сгенеруванні PDF');
    }
  };

  if (loading) {
    return <div className="loading">Завантаження...</div>;
  }

  return (
    <div className="price-calculator">
      <header className="calculator-header">
        <h1>Кошторис</h1>
        {/* <p>Виберіть роботу, введіть площу та додайте до таблиці</p> */}
      </header>

      <div className="calculator-container">
        <section className="form-section">
          <h2>Форма вибору роботи</h2>
          <JobForm 
            categories={categories} 
            onAddJob={handleAddJob}
          />
        </section>

        <section className="table-section">
          <h2>Таблиця робіт</h2>
          <div ref={tableRef} className="table-wrapper">
            <JobTable 
              jobs={jobs} 
              onDeleteJob={handleDeleteJob}
            />
          </div>

          {jobs.length > 0 && (
            <div className="button-group">
              <button 
                onClick={handlePrint} 
                className="btn btn-print"
              >
                🖨️ Друкувати таблицю
              </button>
              <button 
                onClick={handleExportPDF} 
                className="btn btn-pdf"
              >
                📄 Зберегти як PDF
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default PriceCalculator;
