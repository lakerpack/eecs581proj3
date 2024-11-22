* `POST /api/register`: Register a new user.
* `POST /api/login`: Authenticate a user and receive a JWT token.
* `GET /api/user/profile`: Retrieve the authenticated user's profile.
* `PUT /api/user/profile`: Update the authenticated user's profile.
* `POST /api/upload_profile_image`: Upload a profile image for the authenticated user.
* `GET /profile_images/<filename>`: Retrieve a user's profile image.

Protected Routes: Any route decorated with @token_required requires the JWT token in the Authorization header.

## **Implementing User Registration**

### **Frontend Form**

Create a registration form that collects the following fields:

-   **Username**: `username`
-   **Password**: `password`
-   **Name**: `name` (optional)
-   **Description**: `description` (optional)
-   **Profile Image URL**: `profile_image` (optional, if you're allowing URLs)

### **Sending the Registration Request**

When the user submits the registration form, send a `POST` request to `/api/register` with the user's data in JSON format.

**Notes:**

-   The `profile_image` field is optional and can be left empty during registration.
-   The backend expects a JSON payload with the keys `username`, `password`, `name`, `description`, and `profile_image`.

## **Implementing User Login**

### **Frontend Form**

Create a login form that collects:

-   **Username**: `username`
-   **Password**: `password`

### **Sending the Login Request**

When the user submits the login form, send a `POST` request to `/api/login` with the username and password.

**Notes:**

-   Upon successful login, the backend returns a JSON object containing the JWT token and the user's information.
-   Store the JWT token securely on the client side (e.g., in `localStorage` or a secure cookie).
-   Avoid storing sensitive user data on the client side unless necessary.

## **Storing and Using the JWT Token**

### **Storing the Token**

-   **Using: localStorage**
    
```localStorage.setItem('jwtToken', token);```

### **Using the Token in Requests**

For any subsequent requests to protected endpoints, include the JWT token in the `Authorization` header:
```
const token = localStorage.getItem('jwtToken');

fetch('/api/protected_route', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
```

## **Accessing Protected Routes**

Any route that requires authentication will expect the JWT token in the `Authorization` header.

**Example: Fetching User Profile**

## **Updating User Profile**

### **Frontend Form**

Provide a form where the user can update their:

-   **Name**: `name`
-   **Description**: `description`

### **Sending the Update Request**

Send a `PUT` request to `/api/user/profile` with the updated data.

## **Uploading Profile Images**

### **Frontend Form**

Provide a file input for the user to select an image file.

### **Sending the Upload Request**

When the user submits the form, send a `POST` request to `/api/upload_profile_image` with the image file.



## **Displaying User Information**

After retrieving the user's profile data, you can display their information on the frontend.

## **Responses and Errors**

### **Success Responses**

-   For successful operations, the backend returns:
    
    -   A `message` indicating success.
    -   For login, a `token` and `user` object.

### **Error Responses**

-   The backend returns error messages in a consistent format:
```
{
  "error": "Error message here"
}
```
