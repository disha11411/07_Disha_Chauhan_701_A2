const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const path = require("path");

const Employee = require("./models/employee");

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

app.use(session({
    secret: "erpadminsecret",
    resave: false,
    saveUninitialized: true
}));

mongoose.connect("mongodb://127.0.0.1:27017/erpdb")
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error(err));


// --- Hardcoded Admin ---
const ADMIN = {
    username: "admin",
    password: bcrypt.hashSync("admin123", 10) // Encrypted hardcoded password
};

// ---------------- Routes -------------------
// Login Page
app.get("/", (req, res) => {
    res.render("login", { error: null });
});

// Login Handler
app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN.username && bcrypt.compareSync(password, ADMIN.password)) {
        req.session.admin = true;
        return res.redirect("/dashboard");
    }
    res.render("login", { error: "Invalid credentials" });
});

// Dashboard
app.get("/dashboard", (req, res) => {
    if (!req.session.admin) return res.redirect("/");
    res.render("dashboard");
});

// Logout
app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/");
});

// ------------------ Employee CRUD ------------------

// List
app.get("/employees", async (req, res) => {
    if (!req.session.admin) return res.redirect("/");
    const employees = await Employee.find();
    res.render("employee_list", { employees });
});

// Add Form
app.get("/employees/add", (req, res) => {
    if (!req.session.admin) return res.redirect("/");
    res.render("employee_form", { employee: {}, action: "/employees/add" });
});

// Insert
app.post("/employees/add", async (req, res) => {
    const { name, email, basic, hra, da } = req.body;

    // Auto Generate
    const empid = "EMP" + Math.floor(1000 + Math.random() * 9000);
    const plainPassword = empid + "@123";
    const password = await bcrypt.hash(plainPassword, 10);
    const totalSalary = parseFloat(basic) + parseFloat(hra) + parseFloat(da);

    const emp = new Employee({ empid, name, email, basic, hra, da, totalSalary, password });
    await emp.save();

    // Email
    sendMail(email, empid, plainPassword);

    res.redirect("/employees");
});

// Edit Form
app.get("/employees/edit/:id", async (req, res) => {
    const employee = await Employee.findById(req.params.id);
    res.render("employee_form", { employee, action: "/employees/edit/" + req.params.id });
});

// Update
app.post("/employees/edit/:id", async (req, res) => {
    const { name, email, basic, hra, da } = req.body;
    const totalSalary = parseFloat(basic) + parseFloat(hra) + parseFloat(da);

    await Employee.findByIdAndUpdate(req.params.id, { name, email, basic, hra, da, totalSalary });
    res.redirect("/employees");
});

// Delete
app.get("/employees/delete/:id", async (req, res) => {
    await Employee.findByIdAndDelete(req.params.id);
    res.redirect("/employees");
});

// ------------------ Email Function ------------------
function sendMail(to, empid, password) {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "your_email@gmail.com", // your Gmail
            pass: "your_app_password"     // use App Password
        }
    });

    const mailOptions = {
        from: "your_email@gmail.com",
        to,
        subject: "Your ERP Login Credentials",
        text: `Welcome!\nYour EmpID: ${empid}\nPassword: ${password}`
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) console.error(err);
        else console.log("Email sent: " + info.response);
    });
}

// ---------------- Start ------------------
app.listen(3000, () => {
    console.log("Server started at http://localhost:3000");
});