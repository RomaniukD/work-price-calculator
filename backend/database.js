const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_KEY environment variables');
}

const db = createClient(supabaseUrl, supabaseKey);

console.log('Connected to Supabase database');

// Helper functions for database operations
// Note: These functions parse SQL queries and convert them to Supabase operations

const db_run = async (sql, params = []) => {
  try {
    console.log('db_run called with:', { sql, params });
    
    // Parse INSERT statements
    const insertMatch = sql.match(/INSERT INTO (\w+)\s*\((.*?)\)\s*VALUES\s*\((.*?)\)/i);
    if (insertMatch) {
      const table = insertMatch[1];
      const columns = insertMatch[2].split(',').map(s => s.trim());
      
      const values = {};
      columns.forEach((col, idx) => {
        values[col] = params[idx];
      });
      
      console.log(`Inserting into ${table}:`, values);
      const { data, error } = await db.from(table).insert([values]).select();
      if (error) {
        console.error(`INSERT error for table ${table}:`, error.message);
        throw error;
      }
      
      const insertedId = data?.[0]?.id;
      console.log(`Inserted into ${table}, ID:`, insertedId, 'Full data:', data?.[0]);
      return { id: insertedId, changes: 1 };
    }
    
    // Parse UPDATE statements
    const updateMatch = sql.match(/UPDATE (\w+)\s+SET\s+(.*?)\s+WHERE\s+(.*)/i);
    if (updateMatch) {
      const table = updateMatch[1];
      const setClause = updateMatch[2];
      const whereClause = updateMatch[3];
      
      console.log('UPDATE parsing:', { setClause, whereClause });
      
      const updates = {};
      const parts = setClause.split(',').map(s => s.trim());
      let paramIdx = 0;
      
      // Only process SET parts that have ? placeholders
      parts.forEach(part => {
        if (part.includes('?')) {
          const [col] = part.split('=').map(s => s.trim());
          updates[col] = params[paramIdx++];
          console.log(`SET ${col} = params[${paramIdx - 1}] = ${params[paramIdx - 1]}`);
        } else if (part.includes('CURRENT_TIMESTAMP')) {
          // Handle CURRENT_TIMESTAMP specially - don't consume a parameter
          const [col] = part.split('=').map(s => s.trim());
          updates[col] = 'CURRENT_TIMESTAMP';
          console.log(`SET ${col} = CURRENT_TIMESTAMP (no param)`);
        }
      });
      
      // Now process WHERE clause - remaining params are for WHERE
      const whereMatch = whereClause.match(/(\w+)\s*=\s*\?/);
      if (whereMatch) {
        const whereCol = whereMatch[1];
        const whereVal = params[paramIdx];
        
        console.log(`WHERE ${whereCol} = params[${paramIdx}] = ${whereVal}`);
        
        // Handle CURRENT_TIMESTAMP in updates by removing it from updates object
        // and letting Supabase use its default
        if (updates.updated_at === 'CURRENT_TIMESTAMP') {
          delete updates.updated_at;
        }
        
        const { data, error } = await db
          .from(table)
          .update(updates)
          .eq(whereCol, whereVal)
          .select();
        
        if (error) {
          console.error(`UPDATE error for WHERE ${whereCol}=${whereVal}:`, error.message);
          throw error;
        }
        return { id: data?.[0]?.id, changes: data?.length || 0 };
      }
    }
    
    throw new Error('Unsupported SQL operation: ' + sql);
  } catch (err) {
    console.error('db_run error:', err.message);
    throw err;
  }
};

const db_get = async (sql, params = []) => {
  try {
    // Parse SELECT statements
    const selectMatch = sql.match(/SELECT\s+(.*?)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.*?))?(?:\s+LIMIT)?$/i);
    if (selectMatch) {
      const columns = selectMatch[1].trim();
      const table = selectMatch[2];
      const whereClause = selectMatch[3];
      
      let query = db.from(table).select(columns === '*' ? '*' : columns);
      
      if (whereClause) {
        // Split by AND to handle multiple conditions
        const conditions = whereClause.split(/\s+AND\s+/i);
        let paramIdx = 0;
        
        for (const condition of conditions) {
          const condMatch = condition.match(/(\w+)\s*=\s*\?/i);
          if (condMatch) {
            const col = condMatch[1];
            const val = params[paramIdx++];
            query = query.eq(col, val);
          }
        }
      }
      
      const { data, error } = await query.limit(1).single();
      if (error && error.code === 'PGRST116') return null;
      if (error) throw error;
      return data;
    }
    
    throw new Error('Unsupported SELECT query: ' + sql);
  } catch (err) {
    console.error('db_get error:', err.message);
    throw err;
  }
};

const db_all = async (sql, params = []) => {
  try {
    // Parse SELECT statements
    const selectMatch = sql.match(/SELECT\s+(.*?)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.*?))?(?:\s+ORDER BY\s+(.*?))?$/i);
    if (selectMatch) {
      const columns = selectMatch[1].trim();
      const table = selectMatch[2];
      const whereClause = selectMatch[3];
      const orderClause = selectMatch[4];
      
      let query = db.from(table).select(columns === '*' ? '*' : columns);
      
      if (whereClause) {
        // Split by AND to handle multiple conditions
        const conditions = whereClause.split(/\s+AND\s+/i);
        let paramIdx = 0;
        
        for (const condition of conditions) {
          const condMatch = condition.match(/(\w+)\s*=\s*\?/i);
          if (condMatch) {
            const col = condMatch[1];
            const val = params[paramIdx++];
            query = query.eq(col, val);
          }
        }
      }
      
      if (orderClause) {
        const orderMatch = orderClause.match(/(\w+)(?:\s+(ASC|DESC))?/i);
        if (orderMatch) {
          const ascending = !orderMatch[2] || orderMatch[2].toUpperCase() === 'ASC';
          query = query.order(orderMatch[1], { ascending });
        }
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
    
    throw new Error('Unsupported SELECT query: ' + sql);
  } catch (err) {
    console.error('db_all error:', err.message);
    throw err;
  }
};

// Clear all data from database
const clearDatabase = async () => {
  try {
    await db.from('tasks').delete().neq('id', 0);
    await db.from('subcategories').delete().neq('id', 0);
    await db.from('categories').delete().neq('id', 0);
  } catch (err) {
    throw err;
  }
};

module.exports = {
  db,
  db_run,
  db_get,
  db_all,
  clearDatabase
};
