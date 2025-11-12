import React, { useState } from "react";

const LoginModal = ({ open, onClose }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSignup && formData.password !== formData.confirmPassword) {
      // alert("Passwords do not match!");
      return;
    }
    // alert(
    //   isSignup
    //     ? `Signing up with\nEmail: ${formData.email}`
    //     : `Logging in with\nEmail: ${formData.email}`
    // );
    setFormData({ email: "", password: "", confirmPassword: "" });
    onClose();
  };

  if (!open) return null;

   const handleEmailLogin = async (e) => {
    e.preventDefault();

    try {
      setIsLoading(true);

      const res = await apiFunctions.userLogin(formData);

      if (res?.status === 200 && res?.data?.token) {
        showSnackbar("Logged in successfully!", "success");

        const decodedToken = jwtDecode(res?.data?.token);
        localStorage.setItem("access-token", res.data.token);
        localStorage.setItem("mail", decodedToken?.email || "");
        setTimeout(() => {
          if (redirectUrl) {
            const token = res.data.token;
            const email = decodedToken?.email || "";

            const baseUrl = redirectUrl.startsWith("http")
              ? redirectUrl
              : `http://localhost:5174${redirectUrl}`;

            const childUrl = `${baseUrl}?token=${encodeURIComponent(
              token
            )}&email=${encodeURIComponent(email)}`;

            window.location.href = childUrl; 
          } else {
            navigate(pageRoutes.home);
          }
        }, 1000);
      } else if (res.status === 403) {
        showSnackbar(
          res.message || "Access denied. Your email is not allowed to log in.",
          "error"
        );
        setTimeout(() => setOpenDialog(true), 1000);
      } else if (res?.status === 401) {
        showSnackbar(
          res?.message || "Email not verified. Please check your inbox.",
          "error"
        );
      } else {
        showSnackbar("Invalid email or password", "error");
      }
    } catch (error) {
      console.error("Login error:", error);
      showSnackbar("Login failed. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-xl relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold"
        >
          &times;
        </button>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center mb-4">
          {isSignup ? "Create Account" : "Welcome Back"}
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {isSignup && (
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          )}

          <button
            type="submit"
            className="w-full bg-green-500 text-white py-3 rounded-lg font-bold hover:bg-green-600 transition"
          >
            {isSignup ? "Sign Up" : "Login"}
          </button>
        </form>

        {/* Toggle Login/Signup */}
        <p className="text-center text-gray-600 mt-4">
          {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
          <span
            className="text-green-500 font-semibold cursor-pointer"
            onClick={() => setIsSignup(!isSignup)}
          >
            {isSignup ? "Login" : "Sign Up"}
          </span>
        </p>
      </div>
    </div>
  );
};

export default LoginModal;
