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

app.use(express.json());
app.use(bodyParser.json());
app.use(cors());
app.use(cookieParser());

// Establish connectivity with database
const db = mysql.createConnection({
  host: 'localhost',
  port: 3307,
  user: 'root',
  password: '',
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
  const { username, email, name } = req.body;

  // Validate required fields
  if (!username || !email || !name) {
    return res.status(400).send('Username, email, and name are all required!');
  }

  const query = 'UPDATE users SET username=?, email=?, name=? WHERE userid=?';
  db.query(query, [username, email, name, UserID], (err, results) => {
    if (err) {
      return res.status(500).send(err);
    }

    // Check if any rows were affected (i.e., if the user was found and updated)
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User updated successfully' });
  });
});


// Get tasks for a user
app.get('/tasks', verifyToken, (req, res) => {
  const userId = req.user.id;

  const query = 'SELECT TaskId, TaskName FROM tasks WHERE Status = ? AND AssignedTo = ?';
  db.query(query, ['In Progress', userId], (err, results) => {
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
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueSuffix);
  }
});

const upload = multer({ storage: storage });

app.post('/upload', verifyToken, upload.single('file'), (req, res) => {
  const userId = req.body.userId;
  const taskId = req.body.taskId;
  console.log(taskId);
  const filePath = req.file.path;

  const query = 'INSERT INTO completionProofs (TaskId, ProofFile, submissionAt) VALUES (?, ?, NOW())';
  db.query(query, [taskId, filePath], (err, results) => {
    if (err) {
      res.status(500).send(err);
      return;
    }
    res.status(201).json({ message: 'Proof uploaded successfully', proofId: results.insertId });
  });
});


// Endpoint to get completion proofs
app.get('/completion_proof/:userId', verifyToken, (req, res) => {
  const userId = req.params.userId;

  const query = 'SELECT completionProof FROM completion_proof WHERE userid = ?';
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error retrieving completion proofs from the database:', err);
      return res.status(500).json({ message: 'Failed to retrieve completion proofs', error: err });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'No completion proofs found for the user' });
    }

    const proofs = results.map(result => result.completionProof);
    res.status(200).json({ proofs });
  });
});



// Endpoint to download a specific proof
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



// Get uploaded proofs
app.get('/uploaded-proofs', verifyToken, (req, res) => {
  const query = `
    SELECT cp.ProofID, cp.TaskID, cp.CompletionProof, cp.SubmissionAt, cp.Status, 
           t.TaskName, t.StartDate, t.EndDate, u.username as AssignedUser
    FROM completionProofs cp
    JOIN tasks t ON cp.TaskID = t.TaskID
    JOIN users u ON t.AssignedTo = u.UserID
    WHERE t.AssignedTo = ?;
  `;
  
  db.query(query, [req.user.id], (err, results) => {
    if (err) {
      res.status(500).send(err);
      return;
    }
    res.json(results);
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






app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
