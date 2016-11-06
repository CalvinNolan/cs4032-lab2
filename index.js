const net = require('net');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  const workers = []; // References each of the threads.
  const availability = []; // Tells us if a thread is being used at the moment.
  // Create a thread for each CPU core.
  for(var i = 1; i <= numCPUs; i++) {
    workers[i] = cluster.fork();
    availability[i] = true;
  }

  workers.forEach((worker) => {
    worker.on('message', (message) => {
      if (message.cmd && message.cmd == 'freeThread') {
        availability[message.id] = true;
      } else if (message.cmd && message.cmd == 'killService') {
        workers.forEach((worker) => {
          worker.send('shutdown');
          worker.kill(); 
        });
        setTimeout(process.exit.bind(0), 10);
      }
    });
  });

  net.createServer((c) => {
    var threadId = 1;
    while (threadId <= numCPUs && !availability[threadId]) {
      threadId++;
    }
    workers[threadId].send('conn', c);
    availability[threadId] = false;
  }).listen(2000);

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });

} else {
  // Workers can share any TCP connection
  const server = net.createServer((c) => {
    c.on('close', () => {
      process.send({ cmd: 'freeThread', id: cluster.worker.id})
    });

    c.on('data', (data) => {
      if (startsWith(data.toString(), "HELO")) {
        c.write(data + "IP:" + 0 + "\nPORT:" + 2000 + "\nStudentID:13325852\n");
      } else if (startsWith(data.toString(), "KILL_SERVICE")) {
        process.send({ cmd: 'killService' });
      } else {
        // Anything goes here.
      }
    });
  }).listen(0);;

  process.on('message', function(msg, c) {
    if (msg !== 'conn') {
      return;
    }

    server.emit('connection', c);
  });
};

function startsWith(stringToCheck, constString) {
  return (stringToCheck.substring(0, constString.length) === constString);
};