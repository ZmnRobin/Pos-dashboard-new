const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const port = 5000;

// Connect to MongoDB (make sure MongoDB is running)
mongoose.connect('mongodb+srv://robin_two:robin_two@cluster0.dt9id.mongodb.net/KutirTestDatabase?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define the UserList model
const UserList = mongoose.model('UserList', {
  name: String,
  email: String,
  role: String,
  creationDate: { type: Date, default: Date.now },
});

// Secret key for JWT
const secretKey = 'eyJhbGciOiJIUzI1NiJ9.eyJSb2xlIjoiQWRtaW4iLCJJc3N1ZXIiOiJJc3N1ZXIiLCJVc2VybmFtZSI6IkphdmFJblVzZSIsImV4cCI6MTcwNTIzOTU3NiwiaWF0IjoxNzA1MjM5NTc2fQ.jOBEsyVhHxfe9flQOtPQVKPRxZ_SqGiQJfTANBgtBwE'; // Change this to a secure random key

// Middleware for parsing JSON requests
app.use(bodyParser.json());

// Enable CORS
app.use(cors());

// Define a map to store roles based on usernames
const userRoles = {
  'Admin': 'admin',
  'Accounts': 'accounts',
  'Seller': 'seller',
  // Add more usernames and roles as needed
};

app.post('/auth/login', (req, res) => {
  const { username, password } = req.body;

  // Check if the username and password are valid
  const isValidCredentials = (userRoles[username] && password === '123456');

  if (isValidCredentials) {
    const role = userRoles[username];
    const accessToken = jwt.sign({ role }, secretKey, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ role }, secretKey, { expiresIn: '7d' });

    res.json({
      user: { id: 1, email: `${role}@gmail.com`, name: `Random ${role}`, role },
      backendTokens: { accessToken, refreshToken },
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/auth/refresh', (req, res) => {
  const refreshToken = req.body.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Unauthorized - No refresh token provided' });
  }

  try {
    const decoded = jwt.verify(refreshToken, secretKey);
    const newAccessToken = jwt.sign({ role: decoded.role }, secretKey, { expiresIn: '1h' });

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized - Invalid refresh token' });
  }
});



// Middleware for token verification
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized - No token provided' });
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized - Invalid token' });
  }
};

// Routes

// Get all users
app.get('/users',async (req, res) => {
  try {
    const users = await UserList.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific user by ID
app.get('/users/:id', async (req, res) => {
  try {
    const user = await UserList.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new user
app.post('/users', async (req, res) => {
  try {
    const user = new UserList(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update a user by ID
app.put('/users/:id', async (req, res) => {
  try {
    const user = await UserList.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a user by ID
app.delete('/users/:id', async (req, res) => {
  try {
    const user = await UserList.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
