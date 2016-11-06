# CS4032 Lab2
An thread pooled server with the ability to kill it's service via a request.
The server will respond to "HELO" and "KILL_SERVICE" requests.
This program maintains it's own thread pool of node clusters that are assigned to handle each client connection.

# Installation
Follow the instructions at <a href="https://nodejs.org/en/download/">nodejs.org</a> to download and install NodeJS to be able to run this program.

# Running the Client
After nstalling NodeJS and cloning the repo follow these steps.
<br /><br />
`cd  cs4032-lab2`
<br />
`node index.js port-number number-of-threads`

This will open a server at the port number specified with a thread pool with the number of threads specified. 
If that number of connections is exceeded then requests from new clients will be ignored.
