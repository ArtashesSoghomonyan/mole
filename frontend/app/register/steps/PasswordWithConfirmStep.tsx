"use client";

import { useRef, useState } from "react";
import axios from "axios";

import { CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { FormErrors, StepProps } from "../page";

export default function PasswordWithConfirmStep({ formData, setFormData, errors, setErrors }: StepProps) {
  const passwordTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const validatePassword = (password: string) => {
    if (passwordTimeoutRef.current) {
      clearTimeout(passwordTimeoutRef.current);
      passwordTimeoutRef.current = null;
    }

    setFormData({ ...formData, password: password });

    passwordTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/users/validate-password/`,
          {
            password: password,
            username: formData.username,
            email: formData.email,
            first_name: formData.firstName,
            last_name: formData.lastName,
          },
        );

        if (Object.hasOwn(response.data, "valid") && response.data.valid === true) {
          setErrors((prev: FormErrors) => ({ ...prev, password: "" }));
        } else {
          setErrors((prev: FormErrors) => ({ ...prev, password: response.data.password[0] }));
        }
      } catch {
        setErrors((prev: FormErrors) => ({ ...prev, password: "Something went wrong. Try another password." }));
      }
    }, 1000);
  }

  const validatePasswordConfirm = (passwordConfirm: string) => {
    setFormData({ ...formData, passwordConfirm: passwordConfirm });

    if (passwordConfirm === formData.password) {
      setErrors((prev: FormErrors) => ({ ...prev, passwordConfirm: "" }));
    } else {
      setErrors((prev: FormErrors) => ({ ...prev, passwordConfirm: "Passwords do not match." }));
    }
  }

  return <CardContent className="flex flex-col gap-5">
    <Field>
      <FieldLabel htmlFor="password">Password</FieldLabel>
      <FieldError>{errors.password}</FieldError>
      <Input
        id="password"
        type={showPassword ? "text": "password"}
        value={formData.password}
        onChange={(e) => validatePassword(e.target.value.trim())}
        placeholder="Password"
        aria-invalid={!!errors.password}
        required
        />
    </Field>
    <Field>
      <FieldLabel htmlFor="passwordConfirm">Confirm Password</FieldLabel>
      <FieldError>{errors.passwordConfirm}</FieldError>
      <Input
        id="passwordConfirm"
        type={showPassword ? "text": "password"}
        value={formData.passwordConfirm}
        onChange={(e) => validatePasswordConfirm(e.target.value.trim())}
        placeholder="Confirm the password above"
        aria-invalid={!!errors.passwordConfirm}
        required
        />
    </Field>
    <Field orientation="horizontal">
      <Checkbox
        id="show-password-checkbox"
        name="show-password-checkbox"
        checked={showPassword}
        onCheckedChange={(checked) => setShowPassword(checked === true)}
        />
      <FieldLabel htmlFor="show-password-checkbox">Show Password</FieldLabel>
    </Field>
  </CardContent>
}
