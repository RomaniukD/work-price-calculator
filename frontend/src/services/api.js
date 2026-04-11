// API service for price calculator
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Mock data for development - replace with real API calls
// const mockCategories = [
//   {
//     id: 1,
//     name: 'Будівельні роботи',
//     subcategories: [
//       {
//         id: 1,
//         name: 'Фундамент',
//         tasks: [
//           { id: 1, name: 'Копання ям', pricePerM2: 150 },
//           { id: 2, name: 'Бетонування', pricePerM2: 300 }
//         ]
//       },
//       {
//         id: 2,
//         name: 'Стіни',
//         tasks: [
//           { id: 3, name: 'Кладка цегли', pricePerM2: 200 },
//           { id: 4, name: 'Облицювання', pricePerM2: 250 }
//         ]
//       }
//     ]
//   },
//   {
//     id: 2,
//     name: 'Оздоблювальні роботи',
//     subcategories: [
//       {
//         id: 3,
//         name: 'Малярні роботи',
//         tasks: [
//           { id: 5, name: 'Грунтування', pricePerM2: 50 },
//           { id: 6, name: 'Фарбування', pricePerM2: 100 }
//         ]
//       },
//       {
//         id: 4,
//         name: 'Плиткові роботи',
//         tasks: [
//           { id: 7, name: 'Укладання плитки', pricePerM2: 350 },
//           { id: 8, name: 'Заповнення швів', pricePerM2: 50 }
//         ]
//       }
//     ]
//   }
// ];

// Fetch categories
export const fetchCategories = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/categories`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return []; // fallback to empty array
  }
};

// Fetch subcategories by category ID
export const fetchSubcategories = async (categoryId) => {
        const response = await fetch(`${API_BASE_URL}/categories`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
  const category = data.find(cat => cat.category === categoryId);
  return category?.subcategories || [];
};

// Fetch tasks by subcategory ID
export const fetchTasks = async (categoryId, subcategoryId) => {
          const response = await fetch(`${API_BASE_URL}/categories`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    debugger
    const data = await response.json();
  const category = data.find(cat => cat.id === categoryId);
  const subcategory = category?.subcategories.find(sub => sub.id === subcategoryId);
  return subcategory?.tasks || [];
};

// Update prices
export const updatePrices = async (priceData) => {
  try {
    // Replace with real API call:
    // const response = await fetch(`${API_BASE_URL}/update-prices`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(priceData)
    // });
    // return response.json();
    
    console.log('Prices updated:', priceData);
    return { success: true, message: 'Prices updated successfully' };
  } catch (error) {
    console.error('Error updating prices:', error);
    return { success: false, error };
  }
};
