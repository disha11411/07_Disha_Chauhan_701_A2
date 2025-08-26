const express = require('express');
const path = require('path');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const fs = require('fs');

const app = express();
const PORT = 8000;

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const ext = path.extname(file.originalname).toLowerCase();
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(ext);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif)'));
  }
});

// GET form route
app.get('/', (req, res) => {
  res.render('form', { errors: {}, old: {}, fileErrors: {} }); // pass fileErrors as {}
});

// Upload fields: profilePic (single), otherPics (multiple)
const cpUpload = upload.fields([
  { name: 'profilePic', maxCount: 1 },
  { name: 'otherPics', maxCount: 5 }
]);

// POST register route
app.post('/register', cpUpload,
  [
    body('username')
      .trim()
      .notEmpty().withMessage('Username is required')
      .isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('confirmPassword')
      .custom((value, { req }) => value === req.body.password)
      .withMessage('Passwords do not match'),
    body('email')
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Email must be valid'),
    body('gender')
      .notEmpty().withMessage('Gender is required'),
    body('hobbies')
      .custom((value) => {
        if (!value) return false;
        if (Array.isArray(value)) return value.length > 0;
        return true;
      }).withMessage('Select at least one hobby')
  ],
  (req, res) => {
    const errors = validationResult(req);
    const old = req.body;

    const profilePic = req.files['profilePic'] ? req.files['profilePic'][0] : null;
    const otherPics = req.files['otherPics'] || [];

    // Validate files
    const fileErrors = {};
    if (!profilePic) {
      fileErrors.profilePic = 'Profile picture is required';
    }

    // If any errors (validation or files)
    if (!errors.isEmpty() || Object.keys(fileErrors).length > 0) {
      // Delete uploaded files to clean up
      if (profilePic) fs.unlinkSync(profilePic.path);
      otherPics.forEach(file => fs.unlinkSync(file.path));

      return res.render('form', {
        errors: errors.mapped(),
        fileErrors,
        old
      });
    }

    // Success - prepare data to show and save JSON
    const userData = {
      username: old.username,
      email: old.email,
      gender: old.gender,
      hobbies: Array.isArray(old.hobbies) ? old.hobbies : [old.hobbies],
      profilePic: profilePic.filename,
      otherPics: otherPics.map(f => f.filename)
    };

    // Save user data JSON for download
    const savePath = path.join(__dirname, 'uploads', `userData-${Date.now()}.json`);
    const jsonToSave = {
      username: userData.username,
      email: userData.email,
      gender: userData.gender,
      hobbies: userData.hobbies.join(', '),
      profilePic: userData.profilePic,
      otherPics: userData.otherPics
    };
    fs.writeFileSync(savePath, JSON.stringify(jsonToSave, null, 2));

    res.render('success', { userData, downloadFile: path.basename(savePath) });
  }
);

// Download route
app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(__dirname, 'uploads', filename);
  if (fs.existsSync(filepath)) {
    res.download(filepath);
  } else {
    res.status(404).send('File not found');
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
