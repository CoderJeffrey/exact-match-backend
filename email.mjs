import http from "http";
import emailjs from "@emailjs/nodejs";
import dotenv from "dotenv";
import fs from "fs";
import util from "util";
import ejs from 'ejs';

dotenv.config();
// import { send } from 'emailjs';

import cron from "node-cron";
import { createClient } from "@supabase/supabase-js";
import { exec } from "child_process";

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain");
  res.end("Hello World\n");
});

// set Public Key as global settings
emailjs.init({
  publicKey: process.env.EMAILJS_PUBLIC_KEY,
  privateKey: process.env.EMAILJS_PRIVATE_KEY, // optional, highly recommended for security reasons
});

const port = process.env.PORT || 3001;
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

const readFile = util.promisify(fs.readFile);
// create a list of existing job titles
const existing_job_titles = [
  "Software Engineer Intern",
  "Quantitative Trading Intern",
  "Investment Engineer Intern",
  "Investment Banking Analyst Intern",
];

// Create a Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// get the html file for the email template
async function renderHtml() {
  // Read the template
  const template = await readFile('./template.ejs', 'utf8');

  // Render the template with the jobs_html variable
  const html = ejs.render(template, { jobs_html: 'testing JOB_HTML' });

  // Now you can use the html string
  console.log(html);
}


const callPythonScript = () => {
  return new Promise((resolve, reject) => {
    exec("python webcrawler/crawlPitts.py", (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.error(`Python script error: ${stderr}`);
        reject(new Error(stderr));
        return;
      }

      console.log("Python script of crawlPitts.py initialized: " + stdout);
      resolve(stdout);
    });
  });
};

// extract json data from the .json file under same directory and upload the json data to supabase table Positions
const uploadJsonToSupabase = async () => {
  // read the json file
  console.log("Start uploading json data to supabase table Positions");
  let jobs_json = null;
  try {
    // Read the file
    const data = await readFile("./scraped_pittcsc.json", "utf8");

    // Parse the JSON content
    jobs_json = JSON.parse(data);
  } catch (error) {
    console.error("Error reading JSON file:", error);
  }

  if (jobs_json != null) {
    // Iterate over each object in the array
    for (let job_json of jobs_json) {
      // Extract the specific fields
      const companyName = job_json.Name;
      const location = job_json.Location;
      const sponsorship = job_json.Sponsorship === "Yes" ? "YES" : "NO";
      const joblink = job_json.Link;
      // if job link is null or empty, skip this job
      if (
        joblink === null ||
        joblink === "null" ||
        joblink === "" ||
        joblink === undefined
      ) {
        continue;
      }

      const position = "Software Engineer Intern";
      const accepted_grade_level = "Sophomore, Junior, Senior";
      let diversity =
        "White, African American, Asian, Native American, Native Hawaiian or Pacific Islander,  Hispanic or Latino, Middle Eastern, Multiracial ";

      // Log the fields
      console.log(
        `Name: ${companyName}, Location: ${location}, Sponsorship: ${sponsorship}, Link: ${joblink}`
      );

      // upload the json data to supabase table Positions
      const { error: upsertError } = await supabase.from("Positions").upsert([
        {
          Company: companyName,
          Position: position,
          Location: location,
          Link: joblink,
          Sponsorship: sponsorship,
          GradeLevel: accepted_grade_level,
          Diversity: diversity,
        },
      ]);

      if (upsertError) {
        console.error("Error upserting positions:", upsertError);
        return;
      }
    }
  }
};

// fetch user info based on the email address in the db Users table
const fetch_user_info = async (email) => {
  const { data: users, error } = await supabase
    .from("Users")
    .select("*")
    .eq("email_address", email)
    .single();

  if (error) {
    console.error("Error fetching users:", error);
    return;
  }

  return users;
};

// fetch all jobs from the db Positions table
const fetch_all_jobs = async () => {
  const { data: jobs, error } = await supabase
    .from("Positions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching jobs:", error);
    return;
  }

  return jobs;
};

const sendEmail = async (email, jobs) => {
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
    if (
      position.Sponsorship === "YES" ||
      (position.Sponsorship === "NO" && user_info.sponsorship === "NO") ||
      user_info.sponsorship === null
    ) {
      if (
        position.GradeLevel.includes(user_info.class) ||
        user_info.class === null
      ) {
        // if the job type is the same as the criteria job type
        if (
          position.Position === user_info.job_title ||
          user_info.job_title === null
        ) {
          return true;
        }
      }
    }
    return false;
  });

  // print out the filtered data
  console.log(
    "filtered_data  length:",
    filtered_data.length,
    " for user sponsorship:",
    user_info.sponsorship,
    " race: ",
    user_info.race,
    " class: ",
    user_info.class,
    " job_title: ",
    user_info.job_title
  );

  // if the length of the filtered data is over 10, only send the first 10 jobs
  if (filtered_data.length > 5) {
    filtered_data = filtered_data.slice(0, 5);
  }

  if (filtered_data.length < 1) {
    // if there is no job that matches the user's criteria, don't send an email to user
    return;
  }

  // Generate the HTML code for each entry using a for loop
  let jobs_html = "";
  for (let i = 0; i < filtered_data.length; i++) {
    const entry = filtered_data[i];
    jobs_html += `<div class="u-row-container" style="padding: 0px;background-color: transparent;">
      <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
      <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
          <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: transparent;"><![endif]-->
          
      <!--[if (mso)|(IE)]><td align="center" width="600" style="background-color: #ecf0f1;width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
      <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
      <div style="background-color: #ffffff;height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
      <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
  
      <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
      <tbody>
      <tr>
          <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;" align="left">
          
      <table height="0px" align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;border-top: 1px solid #BBBBBB;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
      <tbody>
          <tr style="vertical-align: top">
          <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top;font-size: 0px;line-height: 0px;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
              <span>&#160;</span>
          </td>
          </tr>
      </tbody>
      </table>
  
          </td>
      </tr>
      </tbody>
      </table>
  
      <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
      <tbody>
      <tr>
          <td style="overflow-wrap:break-word;word-break:break-word;padding:5px 10px 0px;font-family:arial,helvetica,sans-serif;" align="left">
              <h3 style="margin: 0px; color: #000000; line-height: 140%; text-align: center; word-wrap: break-word; font-size: 20px; font-weight: 200;">
                  <strong>${filtered_data[i].Position}</strong>
              </h3>
          </td>
      </tr>
      </tbody>
      </table>
  
      <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
      <tbody>
          <tr>
              <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;" align="left">
                  <div style="font-size: 14px; line-height: 140%; text-align: center; word-wrap: break-word;">
                      <p style="line-height: 140%;"><strong>${filtered_data[i].Company}</strong></p>
                  </div>
              </td>
          </tr>
      </tbody>
      </table>
  
      <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
      <tbody>
          <tr>
              <td align="center">
                <div style="font-size: 16px; line-height: 140%; text-align: center; word-wrap: break-word;">
                  <a href="${filtered_data[i].Link}" style="text-decoration: none;">
                    <span id="apply_span" style="
                      color: #000d73;
                      background-color: #c9daff;
                      font-weight: 700;
                      border-radius: 5px;
                      padding: 5px;
                      font-size: 12px;
                      white-space: nowrap;
                    ">
                      Apply
                    </span>
                  </a>
                </div>
              </td>
            </tr>
            
      </tbody>
      </table>
  
      <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
      </div>
      </div>
      <!--[if (mso)|(IE)]></td><![endif]-->
          <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
      </div>
      </div>
      </div>`;
  }

  // Render the template with the jobs_html variable
  const template = await readFile('./template.ejs', 'utf8');
  const message_sent_to_user = ejs.render(template, { jobs_html: jobs_html });
  console.log("message_sent_to_user:", message_sent_to_user);

  try {
    const result = await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      process.env.EMAILJS_TEMPLATE_ID,
      {
        user_name: "Jeffrey_Test",
        user_email: email,
        message: message_sent_to_user,
      }
    );

    console.log("result:", result);
  } catch (error) {
    console.log("error:", error);
  }
};

const send_emails = async (users) => {
  // Get all users that want to receive emails
  // Create an array of promises to send emails concurrently
  let jobs = await fetch_all_jobs();

  // print out user_info and jobs
  // console.log('jobs:', jobs);

  const emailPromises = users.map((user) => {
    sendEmail(user.email_address, jobs);
    console.log("Email sent to:", user.email_address);
  });

  try {
    // Send emails to all users concurrently
    await Promise.all(emailPromises);
    console.log("All emails sent");
  } catch (error) {
    console.log("Error sending emails:", error);
  }
};

// Set the cron job to run every 15 seconds (TESTING)
// const cronSchedule = '*/15 * * * * *';
// Set the cron job to run every 1 minutes (TESTING)
// const cronSchedule = '*/1 * * * *';

const cronSchedule = "30 9 * * 0"; // Run every Sunday at 9:30 AM
cron.schedule(cronSchedule, async () => {
  await callPythonScript();
  await uploadJsonToSupabase();

  // Get all users that want to receive emails and only send to jliu5021@usc.edu
  const { data: users, error } = await supabase
    .from("Users")
    .select("email_address")
    .eq("email_preference", true);
    // .eq("email_address", "jliu5021@usc.edu"); (TESTING)

  if (error) {
    console.error("Error fetching users:", error);
    return;
  }

  // Send emails to all users concurrently
  await send_emails(users);
});
