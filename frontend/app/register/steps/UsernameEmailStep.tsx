"use client";

import { useRef } from "react";
import axios from "axios";

import { CardContent } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { FormErrors, forbiddenUsernames, StepProps } from "../page";

export default function UsernameEmailStep({ formData, setFormData, errors, setErrors }: StepProps) {
  const usernameTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emailTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const validateUsername = (username: string) => {
    // Cancel early pending API call
    if (usernameTimeoutRef.current) {
      clearTimeout(usernameTimeoutRef.current);
      usernameTimeoutRef.current = null;
    }

    setFormData({ ...formData, username: username });

    if (username.length < 1) {
      setErrors({ ...errors, username: "Username is required." });
      return;
    } else if (username.length > 50) {
      setErrors({ ...errors, username: "Choose a username that's under 50 characters." });
      return;
    } else if (!/^[a-z_]+$/.test(username)) {
      setErrors({ ...errors, username: "Username can only contain english letters and underscores." });
      return;
    } else if (forbiddenUsernames.includes(username)) {
      setErrors({ ...errors, username: "This username is not allowed." });
      return;
    }

    usernameTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/users/check-username/`,
          {
            params: {
              username: username,
            },
          },
        );

        if (!response.data.available) {
          setErrors((prev: FormErrors ) => ({ ...prev, username: "This username is already used." }));
        } else {
          setErrors((prev: FormErrors) => ({ ...prev, username: "" }));
        }
      } catch {
        setErrors((prev: FormErrors) => ({ ...prev, username: "Could not check username availability." }));
      }
    }, 1000);
  }

  const validateEmail = (email: string) => {
    // Cancel early pending API call
    if (emailTimeoutRef.current) {
      clearTimeout(emailTimeoutRef.current);
      emailTimeoutRef.current = null;
    }

    setFormData({ ...formData, email: email });

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ ...errors, email: "Please enter a valid email." });
      return;
    }
    // else if (!allowedEmailDomains.includes(email.split("@")[1])) {
    //   setErrors({ ...errors, email: "Sorry this email domain is not supported." });
    //   return;
    // }

    emailTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/users/check-email/`,
          {
            params: {
              email: email,
            },
          },
        );

        if (!response.data.available) {
          setErrors((prev) => ({ ...prev, email: "This email is not available to use." }));
        } else {
          setErrors((prev) => ({ ...prev, email: "" }));
        }
      } catch {
        setErrors((prev) => ({ ...prev, email: "Could not check email availability." }));
      }
    }, 1000);
  }

  return <CardContent className="flex flex-col gap-5">
    <Field>
      <FieldLabel htmlFor="username">Username</FieldLabel>
      <FieldError>{errors.username}</FieldError>
      <Input
        id="username"
        type="text"
        value={formData.username}
        onChange={(e) => validateUsername(e.target.value.trim())}
        placeholder="johndoe"
        aria-invalid={!!errors.username}
        required
        />
    </Field>
    <Field>
      <FieldLabel htmlFor="email">Email</FieldLabel>
      <FieldError>{errors.email}</FieldError>
      <Input
        id="email"
        type="email"
        value={formData.email}
        onChange={(e) => validateEmail(e.target.value.trim())}
        placeholder="johndoe@example.com"
        aria-invalid={!!errors.email}
        required
        />
    </Field>
  </CardContent>
}
