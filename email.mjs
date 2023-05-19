import http from 'http';
import emailjs from '@emailjs/nodejs';
import dotenv from 'dotenv';
dotenv.config();
// import { send } from 'emailjs';

import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';

// Replace these with your own Supabase and SMTP configurations
// const SUPABASE_URL = 'https://jgsjaedtspvvamlbginr.supabase.co';
// const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnc2phZWR0c3B2dmFtbGJnaW5yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY4MTQ5NTY3NSwiZXhwIjoxOTk3MDcxNjc1fQ.ROK79whMn6Tn0joTHWM9Q694WLOBLisTJFGzjiYWhkc';
// const EMAILJS_SERVICE_ID = 'service_dktbkwx';
// const EMAILJS_TEMPLATE_ID = 'template_dqwvwk7';
// const EMAILJS_PUBLIC_KEY = 'tJkFLj72wE3NEF-VO';
// const EMAILJS_PRIVATE_KEY = '_eVsxgBkv3x8CEcWtFzA6';

const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Hello World\n');
});

// set Public Key as global settings
emailjs.init({
    publicKey: process.env.EMAILJS_PUBLIC_KEY,
    privateKey: process.env.EMAILJS_PRIVATE_KEY, // optional, highly recommended for security reasons
 });

  
const port = 3000;
server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`); 
});
  
  // Create a Supabase client
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  
  const sendEmail = async (email) => {
    const message_sent_to_user = `Hello, this is a test email for ${email}`;
    
    try {
    // print out the public key
    // console.log("public key:",EMAILJS_PUBLIC_KEY);
    
      const result = await emailjs.send(
        process.env.EMAILJS_SERVICE_ID,
        process.env.EMAILJS_TEMPLATE_ID,
        {
          user_name: 'Jeffrey_Test',
          user_email: email,
          message: message_sent_to_user,
        }
      );
      
      console.log("result:",result);
    } catch (error) {
      console.log("error:",error);
    }

    
  };
  
  // Set the cron job to run every 15 seconds
  cron.schedule('*/15 * * * * *', async () => {
    // Get all users that want to receive emails
    const { data: users, error } = await supabase
      .from('Users')
      .select('email_address')
      .eq('email_preference', true);
  
    if (error) {
      console.error('Error fetching users:', error);
      return;
    }
  
    // Create an array of promises to send emails concurrently
    const emailPromises = users.map((user) => {
        sendEmail(user.email_address)
        console.log('Email sent to:', user.email_address);
    });
  
    try {
      // Send emails to all users concurrently
      await Promise.all(emailPromises);
      console.log('All emails sent');
    } catch (error) {
      console.log('Error sending emails:', error);
    }
  });