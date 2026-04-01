const API_URL = "http://localhost:3000";

async function register() {
  // Données fixes pour le test
  const userData = {
    email: `testESGI@example.com`,
    password: "Password123!",
    username: "TestUser",
    color: "#FF5733",
  };

  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (response.ok) {
      return data.access_token;
    } else {
      return null;
    }
  } catch (error) {
    console.error(error.message);
  }
}

register();
