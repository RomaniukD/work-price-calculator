import React, { useState, useEffect, useCallback } from 'react';
import './JobForm.css';

const JOB_FORM_STORAGE_KEY = 'priceCalculator.jobForm';

const DEFAULT_JOB_FORM = {
  categoryId: '',
  subcategoryId: '',
  subcategoryName: '',
  taskId: '',
  taskName: '',
  area: '',
  price: '',
  unit: '',
};

const readStoredJobForm = () => {
  try {
    const storedForm = localStorage.getItem(JOB_FORM_STORAGE_KEY);
    return storedForm ? { ...DEFAULT_JOB_FORM, ...JSON.parse(storedForm) } : DEFAULT_JOB_FORM;
  } catch (error) {
    console.error('Error reading job form from localStorage:', error);
    return DEFAULT_JOB_FORM;
  }
};

const writeStoredJobForm = (formData) => {
  try {
    localStorage.setItem(JOB_FORM_STORAGE_KEY, JSON.stringify(formData));
  } catch (error) {
    console.error('Error writing job form to localStorage:', error);
  }
};

const JobForm = ({ categories, onAddJob }) => {
  const [storedForm] = useState(readStoredJobForm);
  const [categoryId, setCategoryId] = useState(storedForm.categoryId);
  const [subcategoryId, setSubcategoryId] = useState(storedForm.subcategoryId);
  const [subcategoryName, setSubcategoryName] = useState(storedForm.subcategoryName);
  const [taskId, setTaskId] = useState(storedForm.taskId);
  const [taskName, setTaskName] = useState(storedForm.taskName);
  const [area, setArea] = useState(storedForm.area);
  const [price, setPrice] = useState(storedForm.price);
  const [unit, setUnit] = useState(storedForm.unit);
  const [subcategories, setSubcategories] = useState([]);
  const [tasks, setTasks] = useState([]);

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
  }, [categoryId, subcategoryId, subcategoryName, taskId, taskName, area, price, unit]);

  // Update subcategories when category changes
  useEffect(() => {
    if (!categoryId) {
      setSubcategories([]);
      setTasks([]);
      return;
    }

    if (!categories.length) return;

    const subs = categories.find(cat => cat.id === parseInt(categoryId))?.subcategories || [];
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSubcategories(subs);
  }, [categoryId, categories]);

  // Update tasks when subcategory changes
  useEffect(() => {
    if (!categoryId || !subcategoryName) {
      setTasks([]);
      return;
    }

    if (!categories.length) return;

    const subs = categories.find(cat => cat.id === parseInt(categoryId))?.subcategories || [];
    const selectedSub = subs.find(sub => sub.name === subcategoryName);
    const tsk = selectedSub?.tasks || [];
    const selectedTask = tsk.find(tskItem => tskItem.name === taskName);

    setTasks(tsk);
    setSubcategoryId(selectedSub?.id || '');
    setTaskId(selectedTask?.id || '');
  }, [categoryId, subcategoryName, taskName, categories]);

  const handleCategoryChange = useCallback((e) => {
    setCategoryId(e.target.value);
    setSubcategoryId('');
    setSubcategoryName('');
    setTaskId('');
    setTaskName('');
    setPrice('');
    setUnit('');
    setTasks([]);
  }, []);

  const handleAreaChange = useCallback((e) => {
    const value = e.target.value;
    // Only allow numeric values
    if (value === '' || !isNaN(value)) {
      setArea(value);
    }
  }, []);

  const handlePriceChange = useCallback((e) => {
    const value = e.target.value;
    // Only allow numeric values
    if (value === '' || !isNaN(value)) {
      setPrice(value);
    }
  }, []);

  const handleSubcategoryChange = useCallback((e) => {
    const value = e.target.value;
    setSubcategoryName(value);
    setTaskId('');
    setTaskName('');
    setPrice('');
    setUnit('');
    
    // Try to find matching subcategory ID
    if (categoryId && value) {
      const subs = categories.find(cat => cat.id === parseInt(categoryId))?.subcategories || [];
      const matchingSub = subs.find(sub => sub.name === value);
      setSubcategoryId(matchingSub?.id || '');
    } else {
      setSubcategoryId('');
    }
  }, [categoryId, categories]);

  const handleTaskChange = useCallback((e) => {
    const value = e.target.value;
    setTaskName(value);
    
    // Try to find matching task
    if (value) {
      const matchingTask = tasks.find(tsk => tsk.name === value);
      if (matchingTask) {
        setTaskId(matchingTask.id);
        setPrice(matchingTask.price.toString());
        setUnit(matchingTask.unit);
      } else {
        setTaskId('');
        // Keep the typed name but clear price/unit for custom text
        setPrice('');
        setUnit('');
      }
    } else {
      setTaskId('');
      setPrice('');
      setUnit('');
    }
  }, [tasks]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();

    if (!taskName.trim()) {
      alert('Будь ласка, введіть назву роботи');
      return;
    }

    const selectedCategory = categories.find(cat => cat.id === parseInt(categoryId));
    const parsedPrice = parseFloat(price) || 0;
    const parsedArea = parseFloat(area) || 0;

    const jobData = {
      id: Date.now(),
      categoryName: selectedCategory?.name || '',
      subcategoryName: subcategoryName,
      taskName: taskName.trim(),
      price: parsedPrice,
      unit,
      area: parsedArea,
      finalPrice: parsedPrice * parsedArea
    };

    onAddJob(jobData);

    // Reset form
    setCategoryId('');
    setSubcategoryId('');
    setSubcategoryName('');
    setTaskId('');
    setTaskName('');
    setArea('');
    setPrice('');
    setUnit('');
    setSubcategories([]);
    setTasks([]);
  }, [categoryId, subcategoryName, taskName, area, price, unit, categories]);

  return (
    <form className="job-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="category">Категорія</label>
        <select
          id="category"
          value={categoryId}
          onChange={handleCategoryChange}
        >
          <option value="">-- Виберіть категорію --</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
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
          {subcategories.map(sub => (
            <option key={sub.id} value={sub.name} />
          ))}
        </datalist>
      </div>

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
          {tasks.map(task => (
            <option key={task.id} value={task.name} label={`${task.price} ${task.unit}`} />
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
          {unit && <span className="price-unit">{unit}</span>}
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
