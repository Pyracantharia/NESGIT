const API_URL = "http://localhost:3000";

const loginData = {
  email: "testESGI@example.com",
  password: "Password123!",
};

async function login() {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginData),
    });

    const data = await response.json();

    if (response.ok) {
      const parts = data.access_token.split(".");
      console.log("Login");
      console.log("Header:", JSON.parse(atob(parts[0])));
      console.log("Payload:", JSON.parse(atob(parts[1])));
      return data.access_token;
    } else {
      console.error(data.message);
      return null;
    }
  } catch (error) {
    console.error(error.message);
  }
}

login();
