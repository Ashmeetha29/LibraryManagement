# 📚 Library Management System

A simple **Library Management System** built with **Node.js**, **Express**, and **MongoDB** to manage books, authors, and borrowing records.  
This project provides a REST API to perform CRUD operations on the library database.

---

## 🚀 Features
- 📖 Add, view, update, and delete books
- ✍️ Manage authors
- 🔍 Search books by title or author
- 🛠 RESTful API design
- 💾 MongoDB database integration

---

## 🛠 Tech Stack
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose)
- **Environment Variables:** dotenv
- **API Testing:** Postman

---

## 📂 Project Structure
LibraryManagement/
│
├── server.js # Main server file
├── models/ # Mongoose schemas
├── routes/ # API routes
├── controllers/ # Route logic
├── .env # Environment variables (not committed to Git)
├── package.json # Dependencies
└── README.md # Project documentation
---

## ⚙️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/library-management.git
   cd library-management
Install dependencies

bash
npm install
Setup environment variables
Create a .env file in the root folder:

ini

PORT=4000
MONGO_URI=mongodb://localhost:27017/library
Run the application

bash
node server.js
or with nodemon (auto-restart on save):

bash
npx nodemon server.js
Access API


http://localhost:4000
📌 Example API Endpoints
Method	Endpoint	Description
GET	/books	Get all books
GET	/books/:id	Get a specific book
POST	/books	Add a new book
PUT	/books/:id	Update book details
DELETE	/books/:id	Delete a book

🧪 Testing API
Use Postman or any API testing tool to check the endpoints.

Example:

json
POST /books
{
    "title": "Harry Potter",
    "author": "J.K. Rowling",
    "year": 1997
}
📄 License
This project is licensed under the MIT License.

