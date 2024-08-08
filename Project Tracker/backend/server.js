const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const md5 = require('md5');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;
const { sendOTP, verifyOtp, resetPassword } = require('./controllers/emailController');



app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({
  origin: 'http://localhost:3001', // Update with your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(cookieParser());

// Establish connectivity with database
const db = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'admin123',
  database: 'projectplanner'
});

db.connect(err => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the database');
});

const secretKey = 'your_secret_key';

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(403).send('A token is required for authentication');
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(403).send('A token is required for authentication');
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).send('Invalid Token');
  }
};

// Login endpoint
app.post('/loginMe', (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = md5(password);

  const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
  db.query(query, [username, hashedPassword], (err, results) => {
    if (err) {
      res.status(500).json({ message: 'Internal server error' });
      return;
    }

    if (results.length === 0) {
      res.status(401).json({ message: 'Invalid username or password' });
      return;
    }

    const user = results[0];
    const token = jwt.sign({ id: user.UserID, username: user.Username, name: user.Name, usertype: user.UserType, useremail: user.Email }, secretKey, { expiresIn: '12h' });
    res.status(200).json({ token });
  });
});

// Add new user
app.post('/users', (req, res) => {
  const { username, name, email, password, usertype } = req.body;

  if (!username || !name || !email || !password || !usertype) {
    res.status(400).send('Username, name, email, password & usertype all are required!');
    return;
  }

  const hashedPassword = md5(password); // Hash the password using md5

  const query = 'INSERT INTO users (userid, username, name, email, password, usertype) VALUES (NULL, ?, ?, ?, ?, ?)';
  db.query(query, [username, name, email, hashedPassword, usertype], (err, results) => {
    if (err) {
      res.status(500).send(err);
      return;
    }
    res.status(201).json({ id: results.insertId, name, email });
  });
});

// Get all users (protected route)
app.get('/users', verifyToken, (req, res) => {
  db.query('SELECT * FROM users', (err, results) => {
    if (err) {
      res.status(500).send(err);
      return;
    }
    res.json(results);
  });
});

// Update user (protected route)
app.put('/users/:userid', verifyToken, (req, res) => {
  const UserID = req.params.userid;
  const { username, name } = req.body;

  // Validate required fields
  if (!username || !name) {
    return res.status(400).send('Username and name are all required!');
  }

  // Check if the username is already taken
  const checkQuery = 'SELECT COUNT(*) as count FROM users WHERE username = ? AND userid != ?';
  db.query(checkQuery, [username, UserID], (err, results) => {
    if (err) {
      return res.status(500).send("Error checking username availability");
    }

    if (results[0].count > 0) {
      // no need to show any msg in json on frontend
      return res.status(409).send('Username already taken');
      
    }

    // Update the user's username and name
    const updateQuery = 'UPDATE users SET username=?, name=? WHERE userid=?';
    db.query(updateQuery, [username, name, UserID], (err, results) => {
      if (err) {
        return res.status(500).send("Error updating user");
      }

      // Check if any rows were affected (i.e., if the user was found and updated)
      if (results.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ message: 'User updated successfully' });
    });
  });
});


// Get tasks for a user
app.get('/tasks', verifyToken, (req, res) => {
  const userId = req.user.id;

  const query = 'SELECT TaskId, TaskName, EndDate FROM tasks WHERE Status IN (?, ?) AND AssignedTo = ?';
  db.query(query, ['In Progress', 'Overdue', userId], (err, results) => {
    if (err) {
      res.status(500).send(err);
      return;
    }
    res.json(results);
  });
});



const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

app.post('/upload', verifyToken, upload.single('file'), (req, res) => {
  const userId = req.body.userId;
  const taskId = req.body.taskId;
  const fileName = btoa(req.file.originalname);
  const filePath = `uploads/${fileName}`;


  // Check if there's any entry for this TaskId in completionProofs
  const checkExistingQuery = 'SELECT * FROM completionProofs WHERE TaskId = ?';
  db.query(checkExistingQuery, [taskId], (err, results) => {
    if (err) {
      res.status(500).send(err);
      return;
    }

    if (results.length > 0) {
      const proof = results[0];
      if (proof.Status === 'Rejected') {
        // Update the existing record and set Status to 'Pending'
        const updateQuery = 'UPDATE completionProofs SET ProofFile = ?, submissionAt = NOW(), Status = ? WHERE TaskId = ?';
        db.query(updateQuery, [fileName, 'Pending', taskId], (updateErr) => {
          if (updateErr) {
            res.status(500).send(updateErr);
            return;
          }
          res.status(200).json({ message: 'Proof updated and status set to Pending.' });
        });
      } else {
        // Update the existing record without changing the status
        const updateQuery = 'UPDATE completionProofs SET ProofFile = ?, submissionAt = NOW() WHERE TaskId = ?';
        db.query(updateQuery, [fileName, taskId], (updateErr) => {
          if (updateErr) {
            res.status(500).send(updateErr);
            return;
          }
          res.status(200).json({ message: 'Proof updated successfully.' });
        });
      }
    } else {
      // No entry exists, proceed to insert the new proof
      insertNewProof(taskId, fileName, res);
    }
  });
});

function insertNewProof(taskId, fileName, res) {
  const insertQuery = 'INSERT INTO completionProofs (TaskId, ProofFile, submissionAt, Status) VALUES (?, ?, NOW(), ?)';
  db.query(insertQuery, [taskId, fileName, 'Pending'], (err, results) => {
    if (err) {
      res.status(500).send(err);
      return;
    }
    res.status(201).json({ message: 'Proof uploaded successfully', proofId: results.insertId });
  });
}



// Fetch tasks assigned to the user
// Get tasks for a user including uploaded proof details
app.get('/tasks/:userId', verifyToken, (req, res) => {
  const { userId } = req.params;
  const query = `
      SELECT 
          t.TaskID, t.TaskName, t.Description, t.StartDate, t.EndDate, t.Status, 
          u.username AS AssignedTo, 
          cp.ProofID, cp.ProofFile, cp.Status AS ProofStatus , cp.SubmissionAt	AS SubmissionAt
      FROM tasks t
      JOIN users u ON t.AssignedTo = u.UserID
      LEFT JOIN completionproofs cp ON t.TaskID = cp.TaskID
      WHERE t.AssignedTo = ?
  `;

  db.query(query, [userId], (err, results) => {
      if (err) {
          res.status(500).send(err);
          return;
      }
      res.json(results);
  });
});

// Endpoint to delete a proof file
app.delete('/proofs/:proofId', verifyToken, (req, res) => {
  const { proofId } = req.params;
  const query = 'DELETE FROM completionproofs WHERE ProofID = ?';

  db.query(query, [proofId], (err, results) => {
      if (err) {
          res.status(500).send(err);
          return;
      }
      res.status(200).send('Proof file deleted successfully');
  });
});



app.get('/pendingVerifications', verifyToken, (req, res) => {
  const userId = req.user.id; // Assuming userId is stored in the token and extracted by verifyToken middleware
  const query = `
    SELECT cp.ProofID, cp.TaskId, cp.ProofFile, cp.submissionAt, cp.Status,
           t.TaskName, t.Description, t.StartDate, t.EndDate, u.username AS AssignedTo
    FROM completionProofs cp
    JOIN tasks t ON cp.TaskId = t.TaskId
    JOIN users u ON t.AssignedTo = u.UserID
    JOIN milestones m ON t.MilestoneID = m.MilestoneID
    JOIN projects p ON m.ProjectID = p.ProjectID
    WHERE p.CreatedBy = ? AND cp.Status = 'Pending'
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      res.status(500).send(err);
      return;
    }
    if (results.length === 0) {
      res.status(404).json({ message: 'No pending verifications' });
      return;
    }
    res.json(results);
  });
});


// Get completion proof details for a specific task
app.get('/completionProofs/:taskId', verifyToken, (req, res) => {
  const { taskId } = req.params;
  const query = `
    SELECT cp.ProofID, cp.TaskId, cp.ProofFile, cp.submissionAt, cp.Status, 
           t.TaskName, t.Description, t.StartDate, t.EndDate, u.username AS AssignedTo
    FROM completionProofs cp
    JOIN tasks t ON cp.TaskId = t.TaskId
    JOIN users u ON t.AssignedTo = u.UserID
    WHERE cp.TaskId = ?
  `;

  db.query(query, [taskId], (err, results) => {
    if (err) {
      res.status(500).send(err);
      return;
    }
    if (results.length === 0) {
      res.status(404).json({ message: 'No proof found for this task' });
      return;
    }
    res.json(results[0]);
  });
});


// Update the status of a completion proof
app.put('/completionProofs/:taskId/status', verifyToken, (req, res) => {
  const { taskId } = req.params;
  const { status } = req.body;

  const query = 'UPDATE completionProofs SET Status = ? WHERE TaskId = ?';
  db.query(query, [status, taskId], (err, results) => {
    if (err) {
      res.status(500).send(err);
      return;
    }
    res.json({ message: 'Status updated successfully' });
  });
});


app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(__dirname, 'uploads', filename);

  fs.access(filepath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error('File does not exist:', filepath);
      return res.status(404).json({ message: 'File not found' });
    }

    res.download(filepath);
  });
});


// Update proof status
app.put('/update-proof-status/:proofId', verifyToken, (req, res) => {
  const { status } = req.body;
  const { proofId } = req.params;

  const query = 'UPDATE completionProofs SET Status = ? WHERE ProofID = ?';
  
  db.query(query, [status, proofId], (err, results) => {
    if (err) {
      res.status(500).send(err);
      return;
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Proof not found' });
    }
    res.json({ message: 'Status updated successfully' });
  });
});


// Fetch tasks assigned to the user
app.get('/tasks/:userId', verifyToken, (req, res) => {
  const { userId } = req.params;
  const query = `
      SELECT t.TaskID, t.TaskName, t.Description, t.StartDate, t.EndDate, t.Status, u.username AS AssignedTo
      FROM tasks t
      JOIN users u ON t.AssignedTo = u.UserID
      WHERE t.AssignedTo = ?
  `;

  db.query(query, [userId], (err, results) => {
      if (err) {
          res.status(500).send(err);
          return;
      }
      res.json(results);
  });
});

// Function to get user ID by email
const getIdByEmail = (email, callback) => {
  const query = 'SELECT UserID FROM users WHERE Email = ?';
  db.query(query, [email], (err, results) => {
    if (err) {
      return callback(err, null);
    }
    if (results.length === 0) {
      return callback(new Error('User not found'), null);
    }
    callback(null, results[0].UserID);
  });
};

// To insert new projects, milestones & tasks
app.post('/projects', verifyToken, (req, res) => {
  const projectData = req.body;

  getIdByEmail(req.user.useremail, (err, userID) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    db.beginTransaction(err => {
      if (err) return res.status(500).json({ error: err.message });

      const projectQuery = `INSERT INTO projects (projectid, projectname, description, startdate, enddate, createdby, status) VALUES (NULL, ?, ?, ?, ?, ?, 'Not Started')`;
      db.query(projectQuery, [projectData.title, projectData.description, projectData.startDate, projectData.endDate, userID], (err, result) => {
        if (err) {
          return db.rollback(() => {
            res.status(500).json({ error: err.message });
          });
        }

        const projectId = result.insertId;
        const milestonePromises = projectData.milestones.map(milestone => {
          return new Promise((resolve, reject) => {
            const milestoneQuery = `INSERT INTO milestones (milestoneid, projectid, seq, milestonename, description, startdate, enddate, status) VALUES (NULL, ?, NULL, ?, ?, ?, ?, 'Not Started')`;
            db.query(milestoneQuery, [projectId, milestone.name, milestone.description, milestone.startDate, milestone.endDate], (err, result) => {
              if (err) return reject(err);

              const milestoneId = result.insertId;
              const taskPromises = (projectData.tasks[milestone.name] || []).map(task => {
                return new Promise((resolve, reject) => {
                  getIdByEmail(task.assignedTo, (err, assignedUserId) => {
                    if (err) return reject(err);

                    const taskQuery = `INSERT INTO tasks (taskid, milestoneid, seq, taskname, description, assignedto, startdate, enddate, status) VALUES (NULL, ?, NULL, ?, ?, ?, ?, ?, 'Not Started')`;
                    db.query(taskQuery, [milestoneId, task.name, task.description, assignedUserId, task.startDate, task.endDate], (err, result) => {
                      if (err) return reject(err);
                      resolve();
                    });
                  });
                });
              });

              Promise.all(taskPromises).then(resolve).catch(reject);
            });
          });
        });

        Promise.all(milestonePromises)
          .then(() => {
            db.commit(err => {
              if (err) {
                return db.rollback(() => {
                  res.status(500).json({ error: err.message });
                });
              }
              res.status(201).json({ message: 'Project created successfully' });
            });
          })
          .catch(err => {
            db.rollback(() => {
              res.status(500).json({ error: err.message });
            });
          });
      });
    });
  });
});

app.post('/projects/new', (req, res) => {
  const { projectID, milestones } = req.body;
  console.log('Received request to update project:', { projectID, milestones });

  db.beginTransaction((err) => {
    if (err) {
      console.error('Error starting transaction:', err);
      return res.status(500).json({ error: 'Error starting transaction' });
    }
    console.log('Transaction started');

    // Fetch existing milestones
    const getExistingMilestonesQuery = `
      SELECT milestoneid, milestonename, description, startdate, enddate 
      FROM milestones 
      WHERE projectid = ?`;
    
    db.query(getExistingMilestonesQuery, [projectID], (err, existingMilestones) => {
      if (err) {
        console.error('Error fetching existing milestones:', err);
        return db.rollback(() => {
          res.status(500).json({ error: 'Error fetching existing milestones' });
        });
      }
      console.log('Fetched existing milestones:', existingMilestones);

      if (!Array.isArray(existingMilestones)) {
        return db.rollback(() => {
          res.status(500).json({ error: 'Expected an array of existing milestones' });
        });
      }

      const existingMilestoneMap = new Map(existingMilestones.map(m => [m.milestoneid, m]));
      const newMilestoneIDs = new Set();

      const processMilestone = (milestone, callback) => {
        console.log('MYMILE :',milestone);
        if (milestone.milestoneid && milestone.milestoneid !== 'New') {
          // Update existing milestone
          newMilestoneIDs.add(milestone.milestoneid);
          console.log('Updating milestone:', milestone.milestoneid);
          db.query(
            `UPDATE milestones SET milestonename = ?, description = ?, startdate = ?, enddate = ? WHERE milestoneid = ?`,
            [milestone.name, milestone.description, milestone.startDate, milestone.endDate, milestone.milestoneid],
            (err) => {
              if (err) return callback(err);
              updateTasks(milestone.milestoneid, milestone.tasks, callback);
            }
          );
        } else {
          // Insert new milestone
          console.log('Inserting new milestone:', milestone.name);
          db.query(
            `INSERT INTO milestones (projectid, seq, milestonename, description, startdate, enddate, status) VALUES (?, NULL, ?, ?, ?, ?, 'Not Started')`,
            [projectID, milestone.name, milestone.description, milestone.startDate, milestone.endDate],
            (err, result) => {
              if (err) return callback(err);
              const milestoneId = result.insertId;
              newMilestoneIDs.add(milestoneId);
              insertTasks(milestoneId, milestone.tasks, callback);
            }
          );
        }
      };

      // Process each milestone
      let completedMilestones = 0;
      milestones.forEach(milestone => {
        processMilestone(milestone, (err) => {
          if (err) {
            console.error('Error processing milestone:', err);
            return db.rollback(() => {
              res.status(500).json({ error: 'Error processing milestones' });
            });
          }
          completedMilestones++;
          if (completedMilestones === milestones.length) {
            // After processing all milestones
            const milestonesToDelete = Array.from(existingMilestoneMap.keys()).filter(id => !newMilestoneIDs.has(id));
            if (milestonesToDelete.length > 0) {
              console.log('Deleting milestones:', milestonesToDelete);
              db.query(`DELETE FROM milestones WHERE milestoneid IN (?)`, [milestonesToDelete], (err) => {
                if (err) {
                  console.error('Error deleting milestones:', err);
                  return db.rollback(() => {
                    res.status(500).json({ error: 'Error deleting milestones' });
                  });
                }
                db.commit((err) => {
                  if (err) {
                    console.error('Error committing transaction:', err);
                    return db.rollback(() => {
                      res.status(500).json({ error: 'Error committing transaction' });
                    });
                  }
                  res.status(201).json({ message: 'Milestones and tasks added/updated successfully' });
                });
              });
            } else {
              db.commit((err) => {
                if (err) {
                  console.error('Error committing transaction:', err);
                  return db.rollback(() => {
                    res.status(500).json({ error: 'Error committing transaction' });
                  });
                }
                res.status(201).json({ message: 'Milestones and tasks added/updated successfully' });
              });
            }
          }
        });
      });
    });
  });

  function updateTasks(milestoneId, tasks, callback) {
    db.query(
      `SELECT taskid, taskname, description, assignedto, startdate, enddate FROM tasks WHERE milestoneid = ?`,
      [milestoneId],
      (err, existingTasks) => {
        if (err) return callback(err);
        console.log('Fetched existing tasks for milestone', milestoneId, ':', existingTasks);

        if (!Array.isArray(existingTasks)) {
          return callback(new Error('Expected an array of existing tasks'));
        }

        const existingTaskMap = new Map(existingTasks.map(t => [t.taskid, t]));
        const newTaskIDs = new Set();

        const processTask = (task, taskCallback) => {
          console.log('MYTASK: ',task);
          getIdByEmail(task.assignedTo, (err, assignedUserId) => {
            if (err) return taskCallback(err);
            if (task.taskid && task.taskid !== 'New') {
              // Update existing task
              newTaskIDs.add(task.taskid);
              console.log('Updating task:', task.taskid);
              db.query(
                `UPDATE tasks SET taskname = ?, description = ?, assignedto = ?, startdate = ?, enddate = ? WHERE taskid = ?`,
                [task.name, task.description, assignedUserId, task.startDate, task.endDate, task.taskid],
                taskCallback
              );
            } else {
              // Insert new task
              console.log('Inserting new task:', task.name);
              db.query(
                `INSERT INTO tasks (milestoneid, seq, taskname, description, assignedto, startdate, enddate, status) VALUES (?, NULL, ?, ?, ?, ?, ?, 'Not Started')`,
                [milestoneId, task.name, task.description, assignedUserId, task.startDate, task.endDate],
                taskCallback
              );
            }
          });
        };

        // Process each task
        let completedTasks = 0;
        tasks.forEach(task => {
          processTask(task, (err) => {
            if (err) return callback(err);
            completedTasks++;
            if (completedTasks === tasks.length) {
              const tasksToDelete = Array.from(existingTaskMap.keys()).filter(id => !newTaskIDs.has(id));
              if (tasksToDelete.length > 0) {
                console.log('Deleting tasks:', tasksToDelete);
                db.query(`DELETE FROM tasks WHERE taskid IN (?)`, [tasksToDelete], callback);
              } else {
                callback();
              }
            }
          });
        });
      }
    );
  }

  function insertTasks(milestoneId, tasks, callback) {
    let completedTasks = 0;
    tasks.forEach(task => {
      getIdByEmail(task.assignedTo, (err, assignedUserId) => {
        if (err) return callback(err);
        console.log('Inserting task:', task.name, 'into milestone:', milestoneId);
        db.query(
          `INSERT INTO tasks (milestoneid, seq, taskname, description, assignedto, startdate, enddate, status) VALUES (?, NULL, ?, ?, ?, ?, ?, 'Not Started')`,
          [milestoneId, task.name, task.description, assignedUserId, task.startDate, task.endDate],
          (err) => {
            if (err) return callback(err);
            completedTasks++;
            if (completedTasks === tasks.length) {
              callback();
            }
          }
        );
      });
    });
  }

  function getIdByEmail(email, callback) {
    db.query(`SELECT userid FROM users WHERE email = ?`, [email], (err, result) => {
      if (err) return callback(err);
      if (result.length === 0) return callback(new Error('User not found'));
      callback(null, result[0].userid);
    });
  }
});

app.get(`/existing-project/:username`, verifyToken, (req, res) => {
  const userID = req.user.id; // Ensure this is set correctly by the verifyToken middleware
  console.log(userID);
  // Check if userID is available
  if (!userID) {
    return res.status(400).json({ error: 'User ID not provided' });
  }

  const query = 'SELECT * FROM projects WHERE CreatedBy = ?';
  db.query(query, [userID], (err, results) => {
    if (err) {
      console.error('Error fetching projects:', err);
      return res.status(500).json({ error: 'Server Error' });
    }
    res.json(results);
  });
});

app.get('/project/:projectname', verifyToken, (req, res) => {
  const projectName = req.params.projectname;
  const userID = req.user.id;
  console.log('Fetching project:', projectName);

  const projectQuery = 'SELECT * FROM projects WHERE projectname = ? and createdby = ?';
  const milestoneQuery = 'SELECT * FROM milestones WHERE projectid = ?';
  const taskQuery = 'SELECT * FROM tasks WHERE milestoneid = ?';

  db.query(projectQuery, [projectName, userID], (err, projectResults) => {
    if (err) {
      console.error('Error fetching project:', err);
      return res.status(500).send(err);
    }

    if (projectResults.length === 0) {
      console.log('No project found with name:', projectName);
      return res.status(404).json({ message: 'Project not found' });
    }

    const project = projectResults[0];
    //console.log('Project details:', project);

    db.query(milestoneQuery, [project.ProjectID], (err, milestoneResults) => {
      if (err) {
        console.error('Error fetching milestones:', err);
        return res.status(500).send(err);
      }

      //console.log('Milestones:', milestoneResults);
      const milestones = milestoneResults;

      const taskPromises = milestones.map(milestone => {
        return new Promise((resolve, reject) => {
          db.query(taskQuery, [milestone.MilestoneID], (err, taskResults) => {
            if (err) {
              console.error('Error fetching tasks:', err);
              return reject(err);
            }

            //console.log('Tasks for milestone', milestone.MilestoneID, ':', taskResults);

            const emailPromises = taskResults.map(task => {
              return new Promise((resolve, reject) => {
                if (task.AssignedTo) {
                  getEmailByID(task.AssignedTo, (err, email) => {
                    if (err) {
                      console.error('Error fetching email for user ID', task.AssignedTo, ':', err);
                      task.AssignedTo = null;
                      return resolve();
                    }
                    task.AssignedTo = email;
                    resolve();
                  });
                } else {
                  task.AssignedTo = null;
                  resolve();
                }
              });
            });

            Promise.all(emailPromises)
              .then(() => {
                milestone.tasks = taskResults;
                resolve();
              })
              .catch(err => {
                console.error('Error fetching emails for tasks:', err);
                reject(err);
              });
          });
        });
      });

      Promise.all(taskPromises)
        .then(() => {
          project.milestones = milestones;
          project.totalTasks = milestones.reduce((total, milestone) => total + milestone.tasks.length, 0);
          project.completedTasks = milestones.reduce((total, milestone) => total + milestone.tasks.filter(task => task.Status === 'Completed').length, 0);
          //console.log('Final project data with milestones, tasks, total task count, and completed tasks count:', project);
          res.json(project);
        })
        .catch(err => {
          console.error('Error processing tasks:', err);
          res.status(500).send(err);
        });
    });
  });
});

// Endpoint to fetch similar emails
app.get('/emails', verifyToken, (req, res) => {
  const partialEmail = req.query.q;

  if (!partialEmail) {
    return res.status(400).json({ error: 'Query parameter q is required' });
  }

  const query = `SELECT email FROM users WHERE email LIKE ? and UserType = 2 LIMIT 10`;
  const values = [`%${partialEmail}%`];

  db.query(query, values, (error, results) => {
    if (error) {
      console.error('Error fetching email suggestions:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }

    const emails = results.map(row => row.email);
    res.json(emails);
  });
});

app.post('/forgotPassword', sendOTP);
app.post('/verifyOtp', verifyOtp);
app.post('/resetPassword', resetPassword);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});


