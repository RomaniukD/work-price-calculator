import React, { useState, useEffect, useCallback } from 'react';
import './JobForm.css';

const JobForm = ({ categories, onAddJob }) => {
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [subcategoryName, setSubcategoryName] = useState('');
  const [taskId, setTaskId] = useState('');
  const [taskName, setTaskName] = useState('');
  const [area, setArea] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('');
  const [subcategories, setSubcategories] = useState([]);
  const [tasks, setTasks] = useState([]);

  // Update subcategories when category changes
  useEffect(() => {
    if (categoryId) {
      const subs = categories.find(cat => cat.id === parseInt(categoryId))?.subcategories || [];
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSubcategories(subs);
      setSubcategoryId('');
      setTasks([]);
      setTaskId('');
    } else {
      setSubcategories([]);
      setTasks([]);
    }
  }, [categoryId]);

  // Update tasks when subcategory changes
  useEffect(() => {
    if (categoryId && subcategoryName) {
      const subs = categories.find(cat => cat.id === parseInt(categoryId))?.subcategories || [];
      const selectedSub = subs.find(sub => sub.name === subcategoryName);
      const tsk = selectedSub?.tasks || [];

      setTasks(tsk);
      setTaskId('');
      setTaskName('');
      setPrice('');
      setUnit('');
    } else {
      setTasks([]);
      setPrice('');
      setUnit('');
    }
  }, [categoryId, subcategoryName, categories]);

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

    if (!categoryId || !subcategoryName || !taskName || !area || area === '0' || !price) {
      alert('Будь ласка, заповніть всі поля');
      return;
    }

    const selectedCategory = categories.find(cat => cat.id === parseInt(categoryId));

    const jobData = {
      id: Date.now(),
      categoryName: selectedCategory?.name,
      subcategoryName: subcategoryName,
      taskName: taskName,
      price: parseFloat(price),
      area: parseFloat(area),
      finalPrice: parseFloat(price) * parseFloat(area)
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
  }, [categoryId, subcategoryName, taskName, area, price, categories]);

  return (
    <form className="job-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="category">Категорія</label>
        <select
          id="category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          required
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
          required
          disabled={!categoryId}
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
          required
          disabled={!subcategoryName}
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
            required
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
          required
        />
      </div>

      <button type="submit" className="btn-add">
        Додати
      </button>
    </form>
  );
};

export default JobForm;
