import React, { useState, useEffect, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import JobForm from "./JobForm";
import JobTable from "./JobTable";
import { fetchCategories } from "../services/api";
import "./PriceCalculator.css";

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
        console.error("Error loading categories:", error);
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
    setJobs(jobs.filter((job) => job.id !== jobId));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    if (!tableRef.current) return;

    try {
      // Add mobile-optimized class for reduced font sizes
      const container =
        tableRef.current.closest(".job-table-container") || tableRef.current;
      const originalStyle = container.getAttribute("style") || "";
      container.style.fontSize = "0.5rem";

      // Hide delete buttons and "Дія" column for PDF
      const deleteButtons = tableRef.current.querySelectorAll(".btn-delete");
      const actionHeaderCell =
        tableRef.current.querySelector("th:nth-child(7)");
      const actionDataCells =
        tableRef.current.querySelectorAll("td:nth-child(7)");

      deleteButtons.forEach((btn) => (btn.style.display = "none"));
      if (actionHeaderCell) actionHeaderCell.style.display = "none";
      actionDataCells.forEach((cell) => (cell.style.display = "none"));

      // Generate canvas with better scale for mobile optimization
      const canvas = await html2canvas(container, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
      });

      // Restore original styles
      container.setAttribute("style", originalStyle);
      deleteButtons.forEach((btn) => (btn.style.display = "block"));
      if (actionHeaderCell) actionHeaderCell.style.display = "";
      actionDataCells.forEach((cell) => (cell.style.display = ""));

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      // Remove margins and headers/footers
      pdf.setProperties({});

      // Adjust image width for better mobile viewing
      const imgWidth = 270;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Calculate positioning
      let yPosition = 8;
      pdf.addImage(imgData, "PNG", 8, yPosition, imgWidth, imgHeight);
      pdf.setFontSize(8);
      // Add total price at the end
      const totalPrice = jobs.reduce((sum, job) => sum + job.finalPrice, 0);
      const pageHeight = pdf.internal.pageSize.height;
      const finalYPosition = yPosition + imgHeight + 5;

      // Check if we need a new page for the total
      if (finalYPosition > pageHeight - 15) {
        pdf.addPage();
        pdf.setFontSize(8);
        pdf.text(`Загальна ціна: ${totalPrice.toFixed(2)} ₴`, 8, 10);
      } else {
        pdf.setFontSize(8);
        pdf.text(
          `Загальна ціна: ${totalPrice.toFixed(2)} ₴`,
          8,
          finalYPosition,
        );
      }

      pdf.save("jobs-list.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Помилка при сгенеруванні PDF");
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
          <JobForm categories={categories} onAddJob={handleAddJob} />
        </section>

        <section className="table-section">
          <h2>Таблиця робіт</h2>
          <div ref={tableRef} className="table-wrapper">
            <JobTable jobs={jobs} onDeleteJob={handleDeleteJob} />
          </div>

          {jobs.length > 0 && (
            <div className="button-group">
              <button onClick={handlePrint} className="btn btn-print">
                🖨️ Друкувати таблицю
              </button>
              <button onClick={handleExportPDF} className="btn btn-pdf">
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
