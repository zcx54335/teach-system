import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xnvqqddrnaynucvatvoq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhudnFxZGRybmF5bnVjdmF0dm9xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAyNjE2NiwiZXhwIjoyMDkwNjAyMTY2fQ.QgxkJe0jydeVpXFbPYgihCF6V7UA80gkZsRqzEQ8MDI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data } = await supabase.from('system_users').select('*');
  console.log(data);
}
run();
