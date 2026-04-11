// API service for price calculator
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Fetch categories
export const fetchCategories = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/categories`);

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return []; // fallback to empty array
  }
};

// Fetch subcategories by category ID
export const fetchSubcategories = async (categoryId) => {
  const response = await fetch(`${API_BASE_URL}/categories`);
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }

  const data = await response.json();
  const category = data.find((cat) => cat.category === categoryId);
  return category?.subcategories || [];
};

// Fetch tasks by subcategory ID
export const fetchTasks = async (categoryId, subcategoryId) => {
  const response = await fetch(`${API_BASE_URL}/categories`);
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }

  const data = await response.json();
  const category = data.find((cat) => cat.id === categoryId);
  const subcategory = category?.subcategories.find(
    (sub) => sub.id === subcategoryId,
  );
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

    console.log("Prices updated:", priceData);
    return { success: true, message: "Prices updated successfully" };
  } catch (error) {
    console.error("Error updating prices:", error);
    return { success: false, error };
  }
};
