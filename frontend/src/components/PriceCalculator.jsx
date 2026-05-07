import React, { useState, useEffect, useRef } from "react";
import html2pdf from "html2pdf.js";
import JobForm from "./JobForm";
import JobTable from "./JobTable";
import { fetchCategories } from "../services/api";
import { buildPdfTable } from "../utils/pdfTable";
import "./PriceCalculator.css";

const JOBS_STORAGE_KEY = "priceCalculator.jobs";
const CUSTOMER_STORAGE_KEY = "priceCalculator.customer";

const DEFAULT_CUSTOMER = {
  name: "",
  phone: "",
  email: "",
  objectAddress: "",
};

const readStorageValue = (key, fallbackValue) => {
  try {
    const storedValue = localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : fallbackValue;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return fallbackValue;
  }
};

const writeStorageValue = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing ${key} to localStorage:`, error);
  }
};

const PriceCalculator = () => {
  const [categories, setCategories] = useState([]);
  const [jobs, setJobs] = useState(() => readStorageValue(JOBS_STORAGE_KEY, []));
  const [customer, setCustomer] = useState(() =>
    readStorageValue(CUSTOMER_STORAGE_KEY, DEFAULT_CUSTOMER)
  );
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

  useEffect(() => {
    writeStorageValue(JOBS_STORAGE_KEY, jobs);
  }, [jobs]);

  useEffect(() => {
    writeStorageValue(CUSTOMER_STORAGE_KEY, customer);
  }, [customer]);

  const handleAddJob = (jobData) => {
    setJobs([...jobs, jobData]);
  };

  const handleDeleteJob = (jobId) => {
    setJobs(jobs.filter((job) => job.id !== jobId));
  };

  const handleCustomerChange = (field, value) => {
    setCustomer((currentCustomer) => ({
      ...currentCustomer,
      [field]: value,
    }));
  };

  const handleExportPDF = async () => {
    if (!tableRef.current) return;

    try {
      const totalPrice = jobs.reduce((sum, job) => sum + job.finalPrice, 0);
      const pdfTable = buildPdfTable({
        jobs,
        customer,
        tableWrapper: tableRef.current,
        totalPrice,
      });

      const options = {
        margin: [10, 10, 10, 10],
        filename: "koshtorys.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: {
          orientation: "portrait",
          unit: "mm",
          format: "a4",
          compress: true,
        },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      };

      html2pdf().set(options).from(pdfTable).save();
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

          <div className="customer-form">
            <h3>Дані замовника</h3>
            <div className="customer-fields">
              <div className="form-group">
                <label htmlFor="customer-name">ПІБ / Назва компанії</label>
                <input
                  id="customer-name"
                  type="text"
                  value={customer.name}
                  onChange={(event) =>
                    handleCustomerChange("name", event.target.value)
                  }
                  placeholder="Введіть ім'я або назву"
                />
              </div>

              <div className="form-group">
                <label htmlFor="customer-phone">Телефон</label>
                <input
                  id="customer-phone"
                  type="tel"
                  value={customer.phone}
                  onChange={(event) =>
                    handleCustomerChange("phone", event.target.value)
                  }
                  placeholder="Введіть номер телефону"
                />
              </div>

              <div className="form-group">
                <label htmlFor="customer-email">Email</label>
                <input
                  id="customer-email"
                  type="email"
                  value={customer.email}
                  onChange={(event) =>
                    handleCustomerChange("email", event.target.value)
                  }
                  placeholder="Введіть email"
                />
              </div>

              <div className="form-group customer-field-wide">
                <label htmlFor="object-address">Адреса об'єкта</label>
                <input
                  id="object-address"
                  type="text"
                  value={customer.objectAddress}
                  onChange={(event) =>
                    handleCustomerChange("objectAddress", event.target.value)
                  }
                  placeholder="Введіть адресу виконання робіт"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="table-section">
          <h2>Таблиця робіт</h2>
          <div ref={tableRef} className="table-wrapper">
            <JobTable jobs={jobs} onDeleteJob={handleDeleteJob} />
          </div>

          {jobs.length > 0 && (
            <div className="button-group">
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
