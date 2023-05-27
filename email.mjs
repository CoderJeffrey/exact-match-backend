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
  
const port = process.env.PORT || 3001;
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

    // Assuming filtered_data is an array of objects containing the data

    // Generate the HTML code for each entry using a for loop
    let jobs_html = '';
    for (let i = 0; i < filtered_data.length; i++) {
      const entry = filtered_data[i];
      jobs_html += ` <div class="u-row-container" style="padding: 0px;background-color: transparent; margin-bottom: 15px;">
      <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
      <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
          <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: transparent;"><![endif]-->
          
      <!--[if (mso)|(IE)]><td align="center" width="600" style="background-color: #ecf0f1;width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
      <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
      <div style="background-color: #ecf0f1;height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
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
              <h2 style="margin: 0px; color: #000000; line-height: 140%; text-align: center; word-wrap: break-word; font-size: 25px; font-weight: 300;">
                  <strong>${filtered_data[i].Position}</strong>
              </h2>
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


    const message_sent_to_user = `
<!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<!--[if gte mso 9]>
<xml>
  <o:OfficeDocumentSettings>
    <o:AllowPNG/>
    <o:PixelsPerInch>96</o:PixelsPerInch>
  </o:OfficeDocumentSettings>
</xml>
<![endif]-->
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <!--[if !mso]><!--><meta http-equiv="X-UA-Compatible" content="IE=edge"><!--<![endif]-->
  <title></title>
  
    <style type="text/css">
      @media only screen and (min-width: 620px) {
  .u-row {
    width: 600px !important;
  }
  .u-row .u-col {
    vertical-align: top;
  }

  .u-row .u-col-100 {
    width: 600px !important;
  }

}

@media (max-width: 620px) {
  .u-row-container {
    max-width: 100% !important;
    padding-left: 0px !important;
    padding-right: 0px !important;
  }
  .u-row .u-col {
    min-width: 320px !important;
    max-width: 100% !important;
    display: block !important;
  }
  .u-row {
    width: 100% !important;
  }
  .u-col {
    width: 100% !important;
  }
  .u-col > div {
    margin: 0 auto;
  }
}
body {
  margin: 0;
  padding: 0;
}

table,
tr,
td {
  vertical-align: top;
  border-collapse: collapse;
}

p {
  margin: 0;
}

.ie-container table,
.mso-container table {
  table-layout: fixed;
}

* {
  line-height: inherit;
}

a[x-apple-data-detectors='true'] {
  color: inherit !important;
  text-decoration: none !important;
}

table { color: #000; }
</style>
  
  

<!--[if !mso]><!--><link href="https://fonts.googleapis.com/css?family=Raleway:400,700&display=swap" rel="stylesheet" type="text/css"><!--<![endif]-->

</head>

<body class="clean-body u_body" style="margin: 0;padding: 0;-webkit-text-size-adjust: 100%;background-color: #e7e7e7;color: #000000">
  <!--[if IE]><div class="ie-container"><![endif]-->
  <!--[if mso]><div class="mso-container"><![endif]-->
  <table id="u_body" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;min-width: 320px;Margin: 0 auto;background-color: #e7e7e7;width:100%" cellpadding="0" cellspacing="0">
  <tbody>
  <tr style="vertical-align: top">
    <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
    <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background-color: #e7e7e7;"><![endif]-->
    

<div class="u-row-container" style="padding: 0px;background-color: transparent">
    <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #ffffff;">
      <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
        <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #ffffff;"><![endif]-->

        <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
        <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
          <div style="height: 100%;width: 100% !important;">
            <!--[if (!mso)&(!IE)]><!-->
            <div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
              <!--<![endif]-->

              <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                <tbody>
                  <tr>
                    <td style="overflow-wrap:break-word;word-break:break-word;padding:20px;font-family:'Cabin',sans-serif;" align="left">

                      <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="padding-right: 0px;padding-left: 0px;" align="center">

                            <img align="center" border="0" src="https://assets.unlayer.com/projects/161404/1684480589155-exact-matchio-high-resolution-logo-black-on-white-background.png" alt="Image" title="Image" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: inline-block !important;border: none;height: auto;float: none;width: 32%;max-width: 179.2px;"
                              width="179.2" />

                          </td>
                        </tr>
                      </table>

                    </td>
                  </tr>
                </tbody>
              </table>

              <!--[if (!mso)&(!IE)]><!-->
            </div>
            <!--<![endif]-->
          </div>
        </div>
        <!--[if (mso)|(IE)]></td><![endif]-->
        <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
      </div>
    </div>
</div>



<div class="u-row-container" style="padding: 0px;background-color: transparent">
  <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
    <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
      <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: transparent;"><![endif]-->
      
<!--[if (mso)|(IE)]><td align="center" width="600" style="background-color: #5941a6;width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
<div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
  <div style="background-color: #EEEEEE;height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
  <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
  
<table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
    <tr>
      <td style="overflow-wrap:break-word;word-break:break-word;padding:10px 10px;font-family:arial,helvetica,sans-serif;" align="left">
        <h2 style="margin: 0px; color: #0c0101; line-height: 100%; text-align: center; word-wrap: break-word; font-family: 'Raleway',sans-serif; font-size: 25px; font-weight: 600;">
            Weekly Job Updates
        </h2>
      </td>
    </tr>
  </tbody>
</table>

<table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
    <tr>
      <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;" align="left">
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
</div>




<!-- Div for jobs -->
<div">
    ${jobs_html}
</div>

<div class="u-row-container" style="padding: 0px;background-color: transparent">
    <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #e5eaf5;">
      <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
        <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #e5eaf5;"><![endif]-->

        <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
        <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
          <div style="height: 100%;width: 100% !important;">
            <!--[if (!mso)&(!IE)]><!-->
            <div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
              <!--<![endif]-->

              <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                <tbody>
                  <tr>
                    <td style="overflow-wrap:break-word;word-break:break-word;padding:41px 55px 18px;font-family:'Cabin',sans-serif;" align="left">

                      <div style="font-size: 14px; color: #003399; line-height: 160%; text-align: center; word-wrap: break-word;">
                        <p style="font-size: 14px; line-height: 160%;"><span style="font-size: 20px; line-height: 32px;"><strong>Get in touch</strong></span></p>
                        <p style="font-size: 14px; line-height: 160%;"><span style="font-size: 16px; line-height: 25.6px; color: #000000;">Exact-Match.io</span></p>
                      </div>

                    </td>
                  </tr>
                </tbody>
              </table>

              <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                <tbody>
                  <tr>
                    <td style="overflow-wrap:break-word;word-break:break-word;padding:10px 10px 33px;font-family:'Cabin',sans-serif;" align="left">

                      <div align="center">
                        <div style="display: table; max-width:146px;">
                          <!--[if (mso)|(IE)]><table width="146" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-collapse:collapse;" align="center"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse; mso-table-lspace: 0pt;mso-table-rspace: 0pt; width:146px;"><tr><![endif]-->


                          <!--[if (mso)|(IE)]><td width="32" style="width:32px; padding-right: 17px;" valign="top"><![endif]-->
                          <table align="left" border="0" cellspacing="0" cellpadding="0" width="32" height="32" style="width: 32px !important;height: 32px !important;display: inline-block;border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;margin-right: 17px">
                            <tbody>
                              <tr style="vertical-align: top">
                                <td align="left" valign="middle" style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
                                  <a href="https://exact-match.io/" title="LinkedIn" target="_blank">
                                    <img src="https://cdn.tools.unlayer.com/social/icons/circle-black/linkedin.png" alt="LinkedIn" title="LinkedIn" width="32" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: none;height: auto;float: none;max-width: 32px !important">
                                  </a>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          <!--[if (mso)|(IE)]></td><![endif]-->

                          <!--[if (mso)|(IE)]><td width="32" style="width:32px; padding-right: 17px;" valign="top"><![endif]-->
                          <table align="left" border="0" cellspacing="0" cellpadding="0" width="32" height="32" style="width: 32px !important;height: 32px !important;display: inline-block;border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;margin-right: 17px">
                            <tbody>
                              <tr style="vertical-align: top">
                                <td align="left" valign="middle" style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
                                  <a href="https://exact-match.io/" title="Instagram" target="_blank">
                                    <img src="https://cdn.tools.unlayer.com/social/icons/circle-black/instagram.png" alt="Instagram" title="Instagram" width="32" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: none;height: auto;float: none;max-width: 32px !important">
                                  </a>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          <!--[if (mso)|(IE)]></td><![endif]-->

                          <!--[if (mso)|(IE)]><td width="32" style="width:32px; padding-right: 0px;" valign="top"><![endif]-->
                          <table align="left" border="0" cellspacing="0" cellpadding="0" width="32" height="32" style="width: 32px !important;height: 32px !important;display: inline-block;border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;margin-right: 0px">
                            <tbody>
                              <tr style="vertical-align: top">
                                <td align="left" valign="middle" style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
                                  <a href="https://exact-match.io/" title="Email" target="_blank">
                                    <img src="https://cdn.tools.unlayer.com/social/icons/circle-black/email.png" alt="Email" title="Email" width="32" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: none;height: auto;float: none;max-width: 32px !important">
                                  </a>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          <!--[if (mso)|(IE)]></td><![endif]-->


                          <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                        </div>
                      </div>

                    </td>
                  </tr>
                </tbody>
              </table>

              <!--[if (!mso)&(!IE)]><!-->
            </div>
            <!--<![endif]-->
          </div>
        </div>
        <!--[if (mso)|(IE)]></td><![endif]-->
        <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
      </div>
    </div>
  </div>

  <div class="u-row-container" style="padding: 0px;background-color: transparent">
    <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #003399;">
      <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
        <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #003399;"><![endif]-->

        <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
        <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
          <div style="height: 100%;width: 100% !important;">
            <!--[if (!mso)&(!IE)]><!-->
            <div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
              <!--<![endif]-->

              <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                <tbody>
                  <tr>
                    <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Cabin',sans-serif;" align="left">

                      <div style="font-size: 14px; color: #fafafa; line-height: 180%; text-align: center; word-wrap: break-word;">
                        <p style="font-size: 14px; line-height: 180%;"><span style="font-size: 16px; line-height: 28.8px;">Copyrights © Exact-Match All Rights Reserved</span></p>
                      </div>

                    </td>
                  </tr>
                </tbody>
              </table>

              <!--[if (!mso)&(!IE)]><!-->
            </div>
            <!--<![endif]-->
          </div>
        </div>
        <!--[if (mso)|(IE)]></td><![endif]-->
        <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
      </div>
    </div>
  </div>
</body>

</html>`;


    
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
  const cronSchedule = '*/15 * * * * *';

  // const cronSchedule = '16 21 * * 0'; // Adjusted schedule for PST (1:16 PM PST)
  // const cronSchedule = '30 9 * * 0'; // Run every Sunday at 9:30 AM
  cron.schedule(cronSchedule, async () => {
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