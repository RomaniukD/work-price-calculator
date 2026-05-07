const PDF_COLUMNS = [
  { title: "#", sourceIndex: null, width: "5%" },
  { title: "Найменування робіт, послуг", sourceIndex: 2, width: "47%" },
  { title: "Ціна", sourceIndex: 3, width: "16%" },
  { title: "Кількість", sourceIndex: 4, width: "14%" },
  { title: "Сума", sourceIndex: 5, width: "18%" },
];

const PDF_DETAILS = {
  title: "Кошторис на виконання будівельних робіт",
  estimateNumber: `${Math.round(Math.random()*10000)}`,
  contractor: {
    title: "Виконавець",
    company: "ФОП Романюк В.А.",
    edrpo: "ЄДРПОУ: 1234567890",
    phone: "Телефон:  +380 (96) 261 91 44",
    email: "Email: vasiltromuyk@gmail.com",
    address: "Адреса: [адреса компанії]",
    note: "Виконавець зобов'язується виконати роботи якісно, у погоджені терміни та відповідно до затвердженого обсягу робіт.",
  },
  customer: {
    title: "Замовник",
    note: "Замовник підтверджує ознайомлення з попереднім обсягом робіт, умовами виконання та орієнтовною вартістю, зазначеною у даному кошторисі.",
  },
  terms: {
    title: "Умови",
    paragraphs: [
      "Даний кошторис є попереднім розрахунком вартості робіт та матеріалів, складеним на основі наданої інформації або огляду об'єкта.",
      "Остаточна вартість може бути уточнена після погодження всіх технічних рішень, вибору матеріалів та затвердження повного обсягу робіт.",
      "Кошторис дійсний протягом 7 календарних днів з дати складання. Після завершення цього строку вартість матеріалів або робіт може бути переглянута.",
      "Роботи, які не зазначені в кошторисі, оплачуються окремо після погодження із замовником.",
      "Оплата здійснюється поетапно: аванс, проміжні платежі за виконані етапи та фінальний розрахунок після завершення робіт.",
    ],
  },
  confirmation: {
    title: "Підтвердження",
    text: "Сторони підтверджують, що ознайомлені з умовами кошторису та погоджують попередній обсяг робіт.",
  },
};

const getCellText = (cell) => cell?.textContent?.trim().replace(/\s+/g, " ") || "";

const formatMoney = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "";
  }

  return number.toFixed(2);
};

const getAmountUnit = (unit) => unit?.split("/")[1]?.trim() || "";

const formatAmount = (amount, unit) => {
  const amountUnit = getAmountUnit(unit);

  return [amount, amountUnit].filter(Boolean).join(" ");
};

const getValueOrPlaceholder = (value, placeholder) => value?.trim() || placeholder;

const formatCustomerDetails = (customer = {}) => ({
  name: `ПІБ / Назва компанії: ${getValueOrPlaceholder(
    customer.name,
    "[ім'я або назва]"
  )}`,
  phone: `Телефон: ${getValueOrPlaceholder(customer.phone, "[номер телефону]")}`,
  email: `Email: ${getValueOrPlaceholder(customer.email, "[email]")}`,
  address: `Адреса об'єкта: ${getValueOrPlaceholder(
    customer.objectAddress,
    "[адреса виконання робіт]"
  )}`,
  object: `Об'єкт: ${getValueOrPlaceholder(
    customer.objectAddress,
    "_________________"
  )}`,
});

const readRowsFromJobs = (jobs) =>
  jobs.map((job, rowIndex) => {
    const sourceCells = [
      job.categoryName || "",
      job.subcategoryName || "",
      job.taskName || "",
      [formatMoney(job.price), job.unit].filter(Boolean).join(" "),
      formatAmount(job.area, job.unit),
      `${formatMoney(job.finalPrice)} ₴`,
    ];

    return PDF_COLUMNS.map((column) => {
      if (column.sourceIndex === null) {
        return String(rowIndex + 1);
      }

      return sourceCells[column.sourceIndex] || "";
    });
  });

const readRowsFromHtmlTable = (tableElement) => {
  const rows = [...tableElement.querySelectorAll("tbody tr")];

  return rows.map((row, rowIndex) => {
    const cells = [...row.querySelectorAll("td")];

    return PDF_COLUMNS.map((column) => {
      if (column.sourceIndex === null) {
        return String(rowIndex + 1);
      }

      return getCellText(cells[column.sourceIndex]);
    });
  });
};

const createElement = (tagName, className, textContent) => {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (textContent) {
    element.textContent = textContent;
  }

  return element;
};

const appendDetailRows = (section, rows) => {
  rows.filter(Boolean).forEach((row) => {
    section.appendChild(createElement("p", "pdf-detail-row", row));
  });
};

const createDetailsSection = (customerDetails) => {
  const details = createElement("section", "pdf-details");

  const meta = createElement("div", "pdf-document-meta");
  appendDetailRows(meta, [
    `Дата складання: ${new Intl.DateTimeFormat("uk-UA").format(new Date())}`,
    `Кошторис №: ${PDF_DETAILS.estimateNumber}`,
    customerDetails.object,
  ]);
  details.appendChild(meta);

  const contractor = createElement("div", "pdf-detail-card");
  contractor.appendChild(createElement("h2", "pdf-detail-title", PDF_DETAILS.contractor.title));
  appendDetailRows(contractor, [
    PDF_DETAILS.contractor.company,
    PDF_DETAILS.contractor.edrpo,
    PDF_DETAILS.contractor.phone,
    PDF_DETAILS.contractor.email,
    PDF_DETAILS.contractor.address,
    PDF_DETAILS.contractor.note,
  ]);
  details.appendChild(contractor);

  const customer = createElement("div", "pdf-detail-card");
  customer.appendChild(createElement("h2", "pdf-detail-title", PDF_DETAILS.customer.title));
  appendDetailRows(customer, [
    customerDetails.name,
    customerDetails.phone,
    customerDetails.email,
    customerDetails.address,
    PDF_DETAILS.customer.note,
  ]);
  details.appendChild(customer);

  const terms = createElement("div", "pdf-detail-card pdf-detail-card-wide");
  terms.appendChild(createElement("h2", "pdf-detail-title", PDF_DETAILS.terms.title));
  appendDetailRows(terms, PDF_DETAILS.terms.paragraphs);
  details.appendChild(terms);

  return details;
};

const createSectionTitle = (title) => createElement("h2", "pdf-section-title", title);

const createConfirmationSection = () => {
  const confirmation = createElement("section", "pdf-confirmation");

  confirmation.appendChild(createSectionTitle(PDF_DETAILS.confirmation.title));
  confirmation.appendChild(createElement("p", "pdf-confirmation-text", PDF_DETAILS.confirmation.text));

  const signatures = createElement("div", "pdf-signatures");
  signatures.appendChild(createElement("p", "", "Виконавець: ____________________"));
  signatures.appendChild(createElement("p", "", "Замовник: ____________________"));
  confirmation.appendChild(signatures);

  return confirmation;
};

const createPdfStyles = () => {
  const style = document.createElement("style");

  style.textContent = `
    .pdf-estimate {
      box-sizing: border-box;
      width: 100%;
      padding: 10mm 8mm;
      color: #1f2937;
      font-family: Arial, sans-serif;
      background: #ffffff;
    }

    .pdf-header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 10px;
      border-bottom: 2px solid #1f2937;
      padding-bottom: 8px;
    }

    .pdf-title {
      margin: 0;
      font-size: 18px;
      line-height: 1.2;
      font-weight: 700;
      color: #111827;
    }

    .pdf-date {
      margin: 0;
      font-size: 11px;
      color: #4b5563;
      white-space: nowrap;
    }

    .pdf-details {
      display: grid;
      grid-template-columns: 1fr;
      gap: 8px;
      margin-bottom: 10px;
      font-size: 9px;
    }

    .pdf-document-meta {
      grid-column: 1 / -1;
      display: grid;
      grid-template-columns: 1fr;
      gap: 3px;
      padding: 6px 7px;
      border: 1px solid #cfd6df;
      background: #f8fafc;
      font-weight: 700;
    }

    .pdf-detail-card {
      min-height: auto;
      padding: 7px;
      border: 1px solid #cfd6df;
      background: #ffffff;
    }

    .pdf-detail-card-wide {
      grid-column: 1 / -1;
      min-height: auto;
    }

    .pdf-detail-title {
      margin: 0 0 4px;
      font-size: 10px;
      line-height: 1.2;
      color: #111827;
      text-transform: uppercase;
    }

    .pdf-detail-row {
      margin: 0 0 3px;
      line-height: 1.3;
      color: #374151;
    }

    .pdf-detail-row:last-child {
      margin-bottom: 0;
    }

    .pdf-section-title {
      margin: 10px 0 6px;
      font-size: 12px;
      line-height: 1.2;
      color: #111827;
    }

    .pdf-table {
      width: 100%;
      table-layout: fixed;
      border-collapse: collapse;
      font-size: 8.5px;
    }

    .pdf-table th {
      padding: 5px 4px;
      border: 1px solid #1f2937;
      background: #243447;
      color: #ffffff;
      font-size: 8px;
      line-height: 1.2;
      text-align: left;
      text-transform: uppercase;
      vertical-align: middle;
    }

    .pdf-table td {
      padding: 5px 4px;
      border: 1px solid #cfd6df;
      color: #1f2937;
      line-height: 1.3;
      vertical-align: top;
      overflow-wrap: anywhere;
    }

    .pdf-table tbody tr:nth-child(even) td {
      background: #f8fafc;
    }

    .pdf-table td:first-child,
    .pdf-table th:first-child,
    .pdf-table td:nth-child(5),
    .pdf-table td:nth-child(6),
    .pdf-table td:nth-child(7) {
      text-align: right;
    }

    .pdf-table td:nth-child(7) {
      font-weight: 700;
      color: #0f7b46;
    }

    .pdf-total {
      display: flex;
      justify-content: flex-end;
      margin-top: 10px;
      font-size: 12px;
      font-weight: 700;
      color: #111827;
    }

    .pdf-total span {
      min-width: 120px;
      margin-left: 12px;
      color: #0f7b46;
      text-align: right;
    }

    .pdf-confirmation {
      margin-top: 14px;
      padding-top: 8px;
      border-top: 1px solid #cfd6df;
      break-inside: avoid;
    }

    .pdf-confirmation-text {
      margin: 0 0 14px;
      font-size: 9px;
      line-height: 1.4;
      color: #374151;
    }

    .pdf-signatures {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 24px;
      font-size: 11px;
      color: #111827;
    }

    .pdf-signatures p {
      margin: 0;
    }
  `;

  return style;
};

export const buildPdfTable = ({ jobs = [], customer = {}, tableWrapper, totalPrice }) => {
  const sourceTable = tableWrapper?.querySelector("table");

  if (!jobs.length && !sourceTable) {
    throw new Error("HTML table was not found");
  }

  const pdfRoot = createElement("div", "pdf-estimate");
  const customerDetails = formatCustomerDetails(customer);

  pdfRoot.appendChild(createPdfStyles());

  const header = createElement("header", "pdf-header");
  header.appendChild(createElement("h1", "pdf-title", PDF_DETAILS.title));
  pdfRoot.appendChild(header);
  pdfRoot.appendChild(createDetailsSection(customerDetails));
  pdfRoot.appendChild(createSectionTitle("Кошторис"));

  const table = createElement("table", "pdf-table");
  const colgroup = document.createElement("colgroup");

  PDF_COLUMNS.forEach((column) => {
    const col = document.createElement("col");
    col.style.width = column.width;
    colgroup.appendChild(col);
  });

  table.appendChild(colgroup);

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  PDF_COLUMNS.forEach((column) => {
    headerRow.appendChild(createElement("th", "", column.title));
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  const rows = jobs.length ? readRowsFromJobs(jobs) : readRowsFromHtmlTable(sourceTable);

  rows.forEach((row) => {
    const tableRow = document.createElement("tr");

    row.forEach((cellText) => {
      tableRow.appendChild(createElement("td", "", cellText));
    });

    tbody.appendChild(tableRow);
  });

  table.appendChild(tbody);
  pdfRoot.appendChild(table);

  const total = createElement("div", "pdf-total", "Загальна ціна:");
  total.appendChild(createElement("span", "", `${totalPrice.toFixed(2)} ₴`));
  pdfRoot.appendChild(total);
  pdfRoot.appendChild(createConfirmationSection());

  return pdfRoot;
};
