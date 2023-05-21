# Backend Server for exact-match.io

The backend server for exact-match.io is responsible for implementing the weekly newsletter functionality. It sends users a personalized weekly newsletter based on their profile information, including their resume, sponsorship needs, class level, job type, and position.

## Installation

To install the required packages, use the following command:

```
npm install
```

This command will download and install all the necessary dependencies for the backend server.

## Running the Server Locally

To start the email server locally, use the following command:

```
node email.mjs
```

This command will boot up the email server, allowing you to test the newsletter functionality on your local machine.

Please note that you may need to provide additional configuration details, such as SMTP server credentials or API keys, to ensure that the email server can send newsletters successfully. Make sure to configure these settings in the appropriate files or environment variables before running the server.

Once the server is running, it will handle incoming requests and generate personalized newsletters based on the users' profile information. The newsletters will be sent to the respective users at the designated intervals, typically weekly.