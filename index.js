const os = require('os');
const net = require('net');
const cluster = require('cluster');

if (cluster.isMaster && ((typeof(process.argv[2]) === 'undefined') || (typeof(process.argv[3]) === 'undefined'))) {
 console.log("Pass through the port number and number of threads to run as command like arguments\n Example: 'node index.js 80 4'");
} else {
  // Master thread
  if (cluster.isMaster) {
    const workers = [];
    const availability = [];
    for(var i = 1; i <= process.argv[3]; i++) {
      workers[i] = cluster.fork();
      availability[i] = true;
    }

    // Setting listeners on each newly created worker to free threads
    // in the pool when they're closed and to listen for a kill service command. 
    workers.forEach((worker) => {
      worker.on('message', (message) => {
        // Free the thread in the pool.
        if (message.cmd && message.cmd == 'freeThread') {
          availability[message.id] = true;
        } 
        // Kill each worker and finally the service.
        else if (message.cmd && message.cmd == 'killService') {
          workers.forEach((worker) => {
            worker.kill(); 
          });
          // Give time for the kill commands to propogate fully.
          setTimeout(process.exit.bind(0), 10);
        }
      });
    });

    // Create the master server that will pass 
    // client connections to the workers.
    net.createServer((c) => {
      var threadId = 1;
      while (threadId <= process.argv[3] && !availability[threadId]) {
        threadId++;
      }

      // If the id has iterated past the number of threads,
      // then each thread is busy and the program will
      // not respond to the request.
      if (threadId <= process.argv[3]) {
        workers[threadId].send('conn', c);
        availability[threadId] = false;
      }
    }).listen(process.argv[2]);
  } 
  // Worker Threads
  else {
    const server = net.createServer((c) => {
      // Send a message back to the master thread on close
      // to free this thread for another client.
      c.on('close', () => {
        process.send({ cmd: 'freeThread', id: cluster.worker.id})
      });

      // Respond to 'HELO' and 'KILL_SERVICE' requests
      c.on('data', (data) => {
        if (data.toString().substring(0, 4) === "HELO") {
          c.write(data + "IP:" + getCurrentIP() + "\nPORT:" + process.argv[2] + "\nStudentID:13325852\n");
        } else if (data.toString().substring(0, 12) === "KILL_SERVICE") {
          process.send({ cmd: 'killService' });
        } else {
          // Anything goes here.
        }
      });
    });

    // Assign this thread's connection via the master thread.
    process.on('message', function(msg, c) {
      if (msg !== 'conn') {
        return;
      }
      server.emit('connection', c);
    });
  };

  function getCurrentIP() {
    var interfaces = os.networkInterfaces();
    var addresses = [];
    for (var k in interfaces) {
        for (var k2 in interfaces[k]) {
            var address = interfaces[k][k2];
            if (address.family === 'IPv4' && !address.internal) {
                addresses.push(address.address);
            }
        }
    }
    return addresses[0];
  };
};