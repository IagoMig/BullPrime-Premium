const SUPABASE_URL = 'https://vtkinxncxptlqspdzsbi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0a2lueG5jeHB0bHFzcGR6c2JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzOTg4NjgsImV4cCI6MjA5OTk3NDg2OH0.tuUwIBLFjKz3o0gQVHU1lZDDUNq1-_N80Ds2_lOA8Kw';

async function check() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/contact_submissions?select=*`, {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        }
    });
    
    if (!res.ok) {
        console.log("Error Status:", res.status);
        const errorText = await res.text();
        console.log("Error Details:", errorText);
    } else {
        const data = await res.json();
        console.log("Success Data:", data);
    }
}
check();
