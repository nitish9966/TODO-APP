const express = require('express');
const app = express();
const port = 8080;
const path = require('path'); // Require the 'path' module

const admin = require('firebase-admin');
const serviceAccount = require('./fullstack.json'); // Replace with the path to your Firebase Admin SDK JSON file

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const bcrypt = require('bcrypt');
const saltRounds = 10; // Number of salt rounds for password hashing

app.use(express.static('public'));

// Body parser middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the index.html (formerly cover.html) as the default route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Route for signup (registration)
app.post('/signup', async (req, res) => {
    try {
        const { FullName, Email, Password } = req.body;

        // Hash the password before storing it
        const hashedPassword = await bcrypt.hash(Password, saltRounds);

        // Check if user with the same email exists (optional)
        const userDoc = await db.collection('RegisteredDB').doc(Email).get();

        if (userDoc.exists) {
            // Send JavaScript code to display an alert and redirect to the signup page
            res.send(`
                <script>
                    alert('User with this email already exists');
                    window.location.href = '/signup'; // Redirect back to the signup page
                </script>
            `);
        } else {
            const newUser = {
                FullName,
                Email,
                Password: hashedPassword // Store the hashed password
            };

            await db.collection('RegisteredDB').doc(Email).set(newUser);

            // Redirect to the login page after successful registration
            res.redirect('/login');
        }
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send('Registration failed');
    }
});


// Route for login page
app.get('/login', (req, res) => {
    // Serve the login.html file or render your login page template
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Route for login
app.post('/login', async (req, res) => {
    try {
        const { Email, Password } = req.body;

        const userDoc = await db.collection('RegisteredDB').doc(Email).get();

        if (userDoc.exists) {
            const userData = userDoc.data();

            // Compare the provided password with the hashed password
            const passwordMatch = await bcrypt.compare(Password, userData.Password);

            if (passwordMatch) {
                // Redirect to the dashboard upon successful login
                res.redirect('/dashboard');
            } else {
                res.send(`
                <script>
                    alert('INVALID PASSWORD. Please Enter Correct Password');
                    window.location.href = '/login'; // Redirect back to the login page
                </script>
            `);            }
        } else {
            res.send(`
            <script>
                alert('Login failed. User does not exist');
                window.location.href = '/login'; // Redirect back to the login page
            </script>
        `);        }
    } catch (error) {
        console.error('Error logging in:', error);
        res.redirect('/login?error=Login failed');
    }
});

// Route for dashboard
app.get('/dashboard', (req, res) => {
    // Serve the dashboard.html file or render your dashboard page template
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.listen(port, () => {
    console.log(`Connected to FireBase Database`);
    console.log(`Server is running on port ${port}`);
    console.log(`http://localhost:${port}`);

});
