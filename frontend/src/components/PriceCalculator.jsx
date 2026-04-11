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
      const container =
        tableRef.current.closest(".job-table-container") || tableRef.current;
      const table = tableRef.current;

      // Store original styles
      const originalStyle = container.getAttribute("style") || "";
      const originalTableStyle = table.getAttribute("style") || "";

      // Apply fixed width and styles for consistent PDF rendering
      container.style.width = "1200px";
      container.style.maxWidth = "1200px";
      container.style.overflow = "visible";
      container.style.margin = "0";
      container.style.padding = "0";

      // Apply hardcoded table styles with absolute sizes
      table.style.width = "100%";
      table.style.borderCollapse = "collapse";
      table.style.fontSize = "10px";
      table.style.fontFamily = "Arial, sans-serif";
      table.style.margin = "0";
      table.style.padding = "0";

      // Style table headers
      const headers = table.querySelectorAll("th");
      const headerStyles = [];
      headers.forEach((th) => {
        headerStyles.push(th.getAttribute("style") || "");
        th.style.padding = "6px 4px";
        th.style.textAlign = "left";
        th.style.fontWeight = "bold";
        th.style.fontSize = "9px";
        th.style.backgroundColor = "#34495e";
        th.style.color = "white";
        th.style.border = "1px solid #2c3e50";
        th.style.lineHeight = "1.2";
      });

      // Style table rows and cells
      const rows = table.querySelectorAll("tbody tr");
      const cellStyles = [];
      rows.forEach((row) => {
        row.style.borderBottom = "1px solid #e9ecef";

        const cells = row.querySelectorAll("td");
        cells.forEach((cell, index) => {
          cellStyles.push(cell.getAttribute("style") || "");
          cell.style.padding = "6px 4px";
          cell.style.fontSize = "10px";
          cell.style.color = "#2c3e50";
          cell.style.border = "1px solid #e9ecef";
          cell.style.lineHeight = "1.2";

          // Final price column styling
          if (cell.classList.contains("final-price")) {
            cell.style.fontWeight = "bold";
            cell.style.color = "#27ae60";
            cell.style.fontSize = "11px";
          }
        });
      });

      // Hide delete buttons and "Дія" column for PDF
      const deleteButtons = table.querySelectorAll(".btn-delete");
      const actionHeaderCell = table.querySelector("th:nth-child(7)");
      const actionDataCells = table.querySelectorAll("td:nth-child(7)");

      deleteButtons.forEach((btn) => (btn.style.display = "none"));
      if (actionHeaderCell) actionHeaderCell.style.display = "none";
      actionDataCells.forEach((cell) => (cell.style.display = "none"));

      // Generate canvas with fixed width
      const canvas = await html2canvas(container, {
        backgroundColor: "#ffffff",
        scale: 1,
        useCORS: true,
        logging: false,
        width: 1200,
        allowTaint: true,
      });

      // Restore original styles
      container.setAttribute("style", originalStyle);
      table.setAttribute("style", originalTableStyle);

      headers.forEach((th, index) => {
        th.setAttribute("style", headerStyles[index]);
      });

      table.querySelectorAll("tbody tr td").forEach((cell, index) => {
        cell.setAttribute("style", cellStyles[index]);
      });

      deleteButtons.forEach((btn) => (btn.style.display = ""));
      if (actionHeaderCell) actionHeaderCell.style.display = "";
      actionDataCells.forEach((cell) => (cell.style.display = ""));

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      pdf.setProperties({});

      // Calculate image dimensions for PDF
      const imgWidth = 280;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let yPosition = 8;
      pdf.addImage(imgData, "PNG", 8, yPosition, imgWidth, imgHeight);

      // Add total price at the end
      const totalPrice = jobs.reduce((sum, job) => sum + job.finalPrice, 0);
      const pageHeight = pdf.internal.pageSize.height;
      const finalYPosition = yPosition + imgHeight + 5;

      if (finalYPosition > pageHeight - 15) {
        pdf.addPage();
        pdf.setFontSize(12);
        pdf.text(`Загальна ціна: ${totalPrice.toFixed(2)} ₴`, 8, 10);
      } else {
        pdf.setFontSize(12);
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
