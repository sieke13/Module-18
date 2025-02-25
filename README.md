
# Google Books Search App

This project is a web application that allows users to search for books using the **Google Books API** and save them to their personal account. The app is built using the **MERN stack** (MongoDB, Express, React, Node.js) and GraphQL with Apollo Server.

### Features:
- Search books using Google Books API.
- User authentication via JWT.
- Save books to the user's personal account.
- View saved books on a separate page.
- Responsive UI with React and Bootstrap.
- Full-stack application using Apollo GraphQL to interact with the backend.

## Technologies Used:
- **Frontend**: React, Apollo Client, Bootstrap, GraphQL
- **Backend**: Node.js, Express.js, Apollo Server, GraphQL, MongoDB
- **Authentication**: JWT (JSON Web Tokens)

---

## Installation & Setup

### Prerequisites:
- Node.js (v16 or later)
- MongoDB (local or cloud with MongoDB Atlas)
- Google Books API Key (to fetch books from Google Books)

### Step-by-Step Setup:

1. **Clone the repository:**

   Clone the repository to your local machine:

   ```bash
   git clone https://github.com/Azugr/Module-18-Challenge
   cd googlebooks-app
   ```

2. **Install dependencies:**

   Install both client and server dependencies:

   ```bash
   npm install
   ```

3. **Configure environment variables:**

   - Create a `.env` file in the root directory of the project (same level as `server` and `client`).
   - Add the following environment variables:

     ```
     MONGODB_URI=mongodb://localhost:27017/googlebooks   # MongoDB connection URL
     JWT_SECRET_KEY=yourSuperSecretKeyHere  # JWT Secret Key for token signing
     GOOGLE_BOOKS_API_KEY=yourGoogleBooksApiKeyHere  # Google Books API Key
     ```

4. **Run the project:**

   You can run both the backend and frontend concurrently using:

   ```bash
   npm run start:dev
   ```

   This will start the backend server (running on port 3001) and the frontend React app (running on port 3000).

---

## API Endpoints:

### **GraphQL Queries:**

1. **Login:**
   - Mutation to authenticate a user with email and password and return a JWT token.

   ```graphql
   mutation login($email: String!, $password: String!) {
     login(email: $email, password: $password) {
       token
       user {
         _id
         username
         email
       }
     }
   }
   ```

2. **Add User:**
   - Mutation to register a new user and return a JWT token.

   ```graphql
   mutation addUser($username: String!, $email: String!, $password: String!) {
     addUser(username: $username, email: $email, password: $password) {
       token
       user {
         _id
         username
         email
       }
     }
   }
   ```

3. **Save Book:**
   - Mutation to save a book to the user's saved books list.

   ```graphql
   mutation saveBook($bookData: BookInput!) {
     saveBook(bookData: $bookData) {
       _id
       username
       savedBooks {
         bookId
         title
         authors
         description
         image
         link
       }
     }
   }
   ```

4. **Remove Book:**
   - Mutation to remove a book from the user's saved books list.

   ```graphql
   mutation removeBook($bookId: String!) {
     removeBook(bookId: $bookId) {
       _id
       username
       savedBooks {
         bookId
         title
         authors
         description
         image
         link
       }
     }
   }
   ```

5. **Get Saved Books (User Query):**
   - Query to get the list of books saved by the logged-in user.

   ```graphql
   query me {
     me {
       _id
       username
       savedBooks {
         bookId
         title
         authors
         description
         image
         link
       }
     }
   }
   ```

---

## Client Application:

- The client application allows users to search for books, view details of each book, and save them to their account.
- It includes a login and sign-up page and allows users to view their saved books.
- All data is stored in the user's MongoDB account using GraphQL mutations.
- The client uses **React** for the UI and **Apollo Client** to communicate with the GraphQL server.

### Components:
- **SearchBooks**: Allows the user to search for books and save them.
- **SavedBooks**: Displays the list of books that the user has saved.
- **LoginForm**: Handles the login process.
- **SignUpForm**: Handles user registration.

### Walkthrough video
https://drive.google.com/file/d/1VYViQkSFgC3z6AQfFHYkuQ0-yPvGPR4O/view?usp=drive_link
---

## Notes:
- Make sure your Google Books API key is correctly set up in the environment variables.
- MongoDB should be running locally or through MongoDB Atlas.
- Ensure the JWT Secret is kept secure and confidential.

---

## License

MIT License
