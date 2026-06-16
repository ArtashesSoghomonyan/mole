"use client";

import { useState } from "react";
import axios from "axios";
import "./style.css";

type FormValues = {
  username: string | null
  email: string | null
  firstName: string | null
  lastName: string | null
  password1: string | null
  password2: string | null
}

const RegisterPage = () => {
  const [finalError, setFinalError] = useState<boolean>(false);

  const [errors, setErrors] = useState<FormValues>({
    username: null,
    email: null,
    firstName: null,
    lastName: null,
    password1: null,
    password2: null,
  });

  const [formData, setFormData] = useState<FormValues>({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    password1: "",
    password2: "",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    Object.values(errors).forEach(item => {
      if (item !== null) return;
    })

    try {
      const response = await axios.post("http://localhost:8000/api/users/register/", {
        email: formData.email,
        username: formData.username,
        first_name: formData.firstName,
        last_name: formData.lastName,
        password: formData.password1,
      });
      alert("Success!!!!!!")
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setFinalError(true);
      }
    }

  }

  const validateUsername = (username: string) => {
    setFormData({...formData, username: username});

    if (!(username.length >= 1 && username.length <= 50)) {
      setErrors({...errors, username: "Username can have less than 50 characters."});
    } else if (!/^[a-z_]+$/.test(username)) {
      setErrors({...errors, username: "Username can only contain english letters and underscores"});
    } else {
      setErrors({...errors, username: null});
    }
  };

  const validateEmail = (email: string) => {
    setFormData({...formData, email: email});

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({...errors, email: "Please enter a valid email."});
    } else {
      setErrors({...errors, email: null});
    }
  }

  const validateFirstName = (firstName: string) => {
    setFormData({...formData, firstName: firstName});

    if (!/^\p{L}+$/u.test(firstName)) {
      setErrors({...errors, firstName: "First name can only contain letters."});
    } else {
      setErrors({...errors, firstName: null});
    }
  }

  const validateLastName = (lastName: string) => {
    setFormData({...formData, lastName: lastName});

    if (!/^\p{L}+$/u.test(lastName)) {
      setErrors({...errors, lastName: "Last name can only contain letters."});
    } else {
      setErrors({...errors, lastName: null});
    }
  }

  const validatePassword1 = (password1: string) => {
    setFormData({...formData, password1: password1});

    if (password1.length <= 7) {
      setErrors({...errors, password1: "Password is too short, it should be at least 8 characters."});
    } else if (/^\d+$/.test(password1)) {
      setErrors({...errors, password1: "Password cannot be entirely numeric."});
    } else if ([formData.username, formData.firstName, formData.lastName, formData.email]
      .some(v => password1.toLowerCase().includes(v.toLowerCase()))) {
      setErrors({...errors, password1: "Password is too similar to your personal information."})
    } else {
      setErrors({...errors, password1: null});
    }
  }

  const validatePassword2 = (password2: string) => {
    setFormData({...formData, password2: password2});

    if (password2 !== formData.password1) {
      setErrors({...errors, password2: "Passwords don't match"});
    } else {
      setErrors({...errors, password2: null});
    }
  }

  return <>
    <form onSubmit={handleSubmit} className="registration-form">
      <h1>Join our community!</h1>
      {finalError && <h2 className="error">Something went wrong try again.</h2>}
      <label htmlFor="username">Username: </label>
      {errors.username && <p className="error">{errors.username}</p>}
      <input
        type="text"
        name="username"
        maxLength={50}
        onChange={e => validateUsername(e.target.value.trim())}
        placeholder="Username"
        required
        />
      <label htmlFor="email">Email: </label>
      {errors.email && <p className="error">{errors.email}</p>}
      <input
        type="email"
        name="email"
        onChange={e => validateEmail(e.target.value.trim())}
        placeholder="Email"
        required
        />
      <label htmlFor="first_name">First Name: </label>
      {errors.firstName && <p className="error">{errors.firstName}</p>}
      <input
        type="text"
        name="first_name"
        maxLength={30}
        onChange={e => validateFirstName(e.target.value.trim())}
        placeholder="First Name"
        required
        />
      <label htmlFor="last_name">Last Name: </label>
      {errors.lastName && <p className="error">{errors.lastName}</p>}
      <input
        type="text"
        name="last_name"
        maxLength={30}
        onChange={e => validateLastName(e.target.value.trim())}
        placeholder="Last Name"
        required
        />
      <label htmlFor="password1">Password: </label>
      {errors.password1 && <p className="error">{errors.password1}</p>}
      <input
        type="password"
        name="password1"
        minLength={8}
        onChange={e => validatePassword1(e.target.value.trim())}
        placeholder="Password"
        required
        />
      <label htmlFor="password2">Confirm Password: </label>
      {errors.password2 && <p className="error">{errors.password2}</p>}
      <input
        type="password"
        name="password2"
        minLength={8}
        onChange={e => validatePassword2(e.target.value.trim())}
        placeholder="Confirm Password"
        required
        />
      <input type="submit" value="Register" className="btn btn-filled" />
    </form>
  </>;
}

export default RegisterPage;
