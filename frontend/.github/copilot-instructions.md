# Price Counter Frontend Project

This is a React-based web application for calculating job prices with category-based filtering.

## Project Overview
- **Framework**: React + Vite
- **Purpose**: Calculate construction/job prices based on categories, subcategories, tasks, and area
- **Features**:
  - Dynamic dropdown lists for categories, subcategories, and tasks
  - Area input with numeric validation
  - Price calculation (price per m² × area)
  - Table display of added jobs
  - Print and PDF export functionality
  - API integration for data management

## Key Components
- `PriceCalculator`: Main component managing form and table state
- `JobForm`: Form component with dropdowns and area input
- `JobTable`: Table displaying added jobs
- API service for backend communication

## Setup & Running
```bash
npm install
npm run dev
```

## Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## API Endpoints (to be implemented)
- `GET /categories` - Fetch all categories
- `POST /update-prices` - Update pricing information

## Status
- ✅ Project scaffolded
- ✅ Dependencies installed
- 🔄 Components being created
- ⏳ API integration pending
