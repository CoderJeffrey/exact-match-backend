import http from 'http';
import emailjs from '@emailjs/nodejs';
import dotenv from 'dotenv';
dotenv.config();
// import { send } from 'emailjs';

import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';

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

  // fetch user info based on the email address in the db Users table
  const fetch_user_info = async (email) => {
    const { data: users, error } = await supabase
      .from('Users')
      .select('*')
      .eq('email_address', email)
      .single();
    
    if (error) {
      console.error('Error fetching users:', error);
      return;
    }
    
    return users;
  };

  // fetch all jobs from the db Positions table
  const fetch_all_jobs = async () => {
    const { data: jobs, error } = await supabase
      .from('Positions')
      .select('*');
    
    if (error) {
      console.error('Error fetching jobs:', error);
      return;
    }

    return jobs;
  };
  
  const sendEmail = async (email, jobs) => {
    const message_sent_to_user = `
      Hello, this is a test email for ${email}
    `;

    let user_info = await fetch_user_info(email);

    // based on user crtieria
    // class: Sophomore
    // race: Asian
    // job_type: Internship
    // Job Title: Software Engineer Intern
    // sponsorship: 'YES'

    // Send out email to user with only the jobs that match their criteria
    // loop though all jobs and check if it matches the user's criteria
    // if it does, add it to the message_sent_to_user
    // if it doesn't, do nothing
    let filtered_data = jobs.filter((position) => {
      // print out the job and the criteria sponsorship
      // console.log("Job.sponsorship == criterias.sponsorship:", position.Sponsorship === user_info.sponsorship)
      // if the job give sponsorship and the criteria can be either YES OR NO
      // if the job does not give sponsorship and the criteria must be NO
      if ((position.Sponsorship === "YES") || (position.Sponsorship=== "NO" && user_info.sponsorship === "NO") || (user_info.sponsorship === null)) {
        if(position.Diversity.includes(user_info.race) || (user_info.race === null)){
          if(position.GradeLevel.includes(user_info.class) || (user_info.class === null)){
            // if the job type is the same as the criteria job type
            if ((position.Position === user_info.job_title) || (user_info.job_title === null)) {
              return true;
            } 
          }
        }
      }
      return false;
    });

    // print out the filtered data
    console.log("filtered_data  length:",filtered_data.length, 
      " for user sponsorship:", user_info.sponsorship, 
      " race: ", user_info.race,
      " class: ", user_info.class,
      " job_title: ", user_info.job_title
    );
    
    // if the length of the filtered data is over 10, only send the first 10 jobs
    if (filtered_data.length > 10) {
      filtered_data = filtered_data.slice(0,10);
    }

    
    /*
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
    */

    
  };

  const send_emails = async (users) => {
    // Get all users that want to receive emails
    // Create an array of promises to send emails concurrently
    let jobs = await fetch_all_jobs();

    // print out user_info and jobs
    // console.log('jobs:', jobs);

    const emailPromises = users.map((user) => {
      sendEmail(user.email_address, jobs)
      console.log('Email sent to:', user.email_address);
    });

    try {
      // Send emails to all users concurrently
      await Promise.all(emailPromises);
      console.log('All emails sent');
    } catch (error) {
      console.log('Error sending emails:', error);
    }
  }
  
  // Set the cron job to run every 15 seconds
  cron.schedule('*/5 * * * * *', async () => {
    // Get all users that want to receive emails
    const { data: users, error } = await supabase
      .from('Users')
      .select('email_address')
      .eq('email_preference', true);
  
    if (error) {
      console.error('Error fetching users:', error);
      return;
    }

    // Send emails to all users concurrently
    send_emails(users);    
  });