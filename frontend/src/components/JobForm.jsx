import React, { useState, useEffect, useCallback, useMemo } from "react";
import "./JobForm.css";

const JOB_FORM_STORAGE_KEY = "priceCalculator.jobForm";

const DEFAULT_JOB_FORM = {
  categoryId: "",
  subcategoryId: "",
  subcategoryName: "",
  taskId: "",
  taskName: "",
  area: "",
  price: "",
  unit: "",
};

const SHOW_CATEGORY_FIELDS = false;

const UNIT_OPTIONS = [
  { value: "", label: "-- Одиниця --" },
  { value: "грн/м²", label: "грн/м²" },
  { value: "грн/м³", label: "грн/м³" },
  { value: "грн/пог. м", label: "грн/пог. м" },
  { value: "грн/м", label: "грн/м" },
  { value: "грн/шт", label: "грн/шт" },
  { value: "грн/компл.", label: "грн/компл." },
  { value: "грн/точка", label: "грн/точка" },
  { value: "грн/год", label: "грн/год" },
  { value: "грн/день", label: "грн/день" },
];

const readStoredJobForm = () => {
  try {
    const storedForm = localStorage.getItem(JOB_FORM_STORAGE_KEY);
    return storedForm
      ? { ...DEFAULT_JOB_FORM, ...JSON.parse(storedForm) }
      : DEFAULT_JOB_FORM;
  } catch (error) {
    console.error("Error reading job form from localStorage:", error);
    return DEFAULT_JOB_FORM;
  }
};

const writeStoredJobForm = (formData) => {
  try {
    localStorage.setItem(JOB_FORM_STORAGE_KEY, JSON.stringify(formData));
  } catch (error) {
    console.error("Error writing job form to localStorage:", error);
  }
};

const JobForm = ({ categories, onAddJob }) => {
  const [storedForm] = useState(readStoredJobForm);
  const [categoryId, setCategoryId] = useState(storedForm.categoryId);
  const [subcategoryId, setSubcategoryId] = useState(storedForm.subcategoryId);
  const [subcategoryName, setSubcategoryName] = useState(
    storedForm.subcategoryName,
  );
  const [taskId, setTaskId] = useState(storedForm.taskId);
  const [taskName, setTaskName] = useState(storedForm.taskName);
  const [area, setArea] = useState(storedForm.area);
  const [price, setPrice] = useState(storedForm.price);
  const [unit, setUnit] = useState(storedForm.unit);

  useEffect(() => {
    writeStoredJobForm({
      categoryId,
      subcategoryId,
      subcategoryName,
      taskId,
      taskName,
      area,
      price,
      unit,
    });
  }, [
    categoryId,
    subcategoryId,
    subcategoryName,
    taskId,
    taskName,
    area,
    price,
    unit,
  ]);

  const selectedCategory = useMemo(
    () => categories.find((cat) => cat.id === parseInt(categoryId)),
    [categoryId, categories],
  );

  const subcategories = useMemo(
    () => selectedCategory?.subcategories || [],
    [selectedCategory],
  );

  const tasks = useMemo(() => {
    const selectedSubcategory = subcategories.find(
      (sub) => sub.name === subcategoryName,
    );

    return selectedSubcategory?.tasks || [];
  }, [subcategoryName, subcategories]);

  const handleCategoryChange = useCallback((e) => {
    setCategoryId(e.target.value);
    setSubcategoryId("");
    setSubcategoryName("");
    setTaskId("");
    setTaskName("");
    setPrice("");
    setUnit("");
  }, []);

  const handleAreaChange = useCallback((e) => {
    const value = e.target.value;
    // Only allow numeric values
    if (value === "" || !isNaN(value)) {
      setArea(value);
    }
  }, []);

  const handlePriceChange = useCallback((e) => {
    const value = e.target.value;
    // Only allow numeric values
    if (value === "" || !isNaN(value)) {
      setPrice(value);
    }
  }, []);

  const handleSubcategoryChange = useCallback(
    (e) => {
      const value = e.target.value;
      setSubcategoryName(value);
      setTaskId("");
      setTaskName("");
      setPrice("");
      setUnit("");

      // Try to find matching subcategory ID
      if (categoryId && value) {
        const matchingSub = subcategories.find((sub) => sub.name === value);
        setSubcategoryId(matchingSub?.id || "");
      } else {
        setSubcategoryId("");
      }
    },
    [categoryId, subcategories],
  );

  const handleTaskChange = useCallback(
    (e) => {
      const value = e.target.value;
      setTaskName(value);

      // Try to find matching task
      if (value) {
        const matchingTask = tasks.find((tsk) => tsk.name === value);
        if (matchingTask) {
          setTaskId(matchingTask.id);
          setPrice(matchingTask.price.toString());
          setUnit(matchingTask.unit);
        } else {
          setTaskId("");
          // Keep the typed name but clear price/unit for custom text
          setPrice("");
          setUnit("");
        }
      } else {
        setTaskId("");
        setPrice("");
        setUnit("");
      }
    },
    [tasks],
  );

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();

      if (!taskName.trim()) {
        alert("Будь ласка, введіть назву роботи");
        return;
      }

      const parsedPrice = parseFloat(price) || 0;
      const parsedArea = parseFloat(area) || 0;

      const jobData = {
        id: Date.now(),
        categoryName: selectedCategory?.name || "",
        subcategoryName: subcategoryName,
        taskName: taskName.trim(),
        price: parsedPrice,
        unit,
        area: parsedArea,
        finalPrice: parsedPrice * parsedArea,
      };

      onAddJob(jobData);

      // Reset form
      setCategoryId("");
      setSubcategoryId("");
      setSubcategoryName("");
      setTaskId("");
      setTaskName("");
      setArea("");
      setPrice("");
      setUnit("");
    },
    [selectedCategory, subcategoryName, taskName, area, price, unit, onAddJob],
  );

  const unitOptions =
    unit && !UNIT_OPTIONS.some((option) => option.value === unit)
      ? [...UNIT_OPTIONS, { value: unit, label: unit }]
      : UNIT_OPTIONS;

  return (
    <form className="job-form" onSubmit={handleSubmit}>
      {/* Category and subcategory selection is hidden for now. */}
      {SHOW_CATEGORY_FIELDS && (
        <>
          <div className="form-group">
            <label htmlFor="category">Категорія</label>
            <select
              id="category"
              value={categoryId}
              onChange={handleCategoryChange}
            >
              <option value="">-- Виберіть категорію --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="subcategory">Підкатегорія</label>
            <input
              id="subcategory"
              type="text"
              list="subcategory-list"
              value={subcategoryName}
              onChange={handleSubcategoryChange}
              placeholder="Виберіть або введіть підкатегорію"
            />
            <datalist id="subcategory-list">
              {subcategories.map((sub) => (
                <option key={sub.id} value={sub.name} />
              ))}
            </datalist>
          </div>
        </>
      )}

      <div className="form-group">
        <label htmlFor="task">Цільова робота</label>
        <input
          id="task"
          type="text"
          list="task-list"
          value={taskName}
          onChange={handleTaskChange}
          placeholder="Виберіть або введіть роботу"
        />
        <datalist id="task-list">
          {tasks.map((task) => (
            <option
              key={task.id}
              value={task.name}
              label={`${task.price} ${task.unit}`}
            />
          ))}
        </datalist>
      </div>

      <div className="form-group">
        <label htmlFor="price">Ціна</label>
        <div className="price-input-wrapper">
          <input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={handlePriceChange}
            placeholder="Введіть ціну"
          />
          <select
            name="unit"
            id="unit"
            className="price-unit"
            aria-label="Одиниця вимірювання"
            onChange={(e) => setUnit(e.target.value)}
            value={unit}
          >
            {unitOptions.map((option) => (
              <option key={option.value || "empty-unit"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="area">Об'єм/кількість</label>
        <input
          id="area"
          type="number"
          step="0.01"
          min="0"
          value={area}
          onChange={handleAreaChange}
          placeholder="Введіть число"
        />
      </div>

      <button type="submit" className="btn-add">
        Додати
      </button>
    </form>
  );
};

export default JobForm;
