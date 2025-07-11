// Test simple de connexion Supabase
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qmhjhnmqeayhgwuntgbr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtaGpobm1xZWF5aGd3dW50Z2JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjE0MDA2MSwiZXhwIjoyMDY3NzE2MDYxfQ.VXTsccWwKCL7mmpqjNg3jraPnUoIxGCKt6VV0MX-g1o';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test simple avec listage des tables
    const { data, error } = await supabase
      .from('profiles')  // ou toute autre table
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Supabase error:', error);
    } else {
      console.log('Supabase connection successful!', data);
    }
  } catch (error) {
    console.error('Connection test failed:', error);
  }
}

testConnection();
