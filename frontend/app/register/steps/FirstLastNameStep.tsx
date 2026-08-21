"use client";

import { CardContent } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { StepProps } from "../page";

export default function FirstLastNameStep({ formData, setFormData, errors, setErrors }: StepProps) {
  const validateFirstName = (firstName: string) => {
    setFormData({ ...formData, firstName: firstName });

    if (!/^\p{L}+$/u.test(firstName)) {
      setErrors({
        ...errors,
        firstName: "First name can only contain letters.",
      });
    } else {
      setErrors({ ...errors, firstName: "" });
    }
  };

  const validateLastName = (lastName: string) => {
    setFormData({ ...formData, lastName: lastName });

    if (!/^\p{L}+$/u.test(lastName)) {
      setErrors({ ...errors, lastName: "Last name can only contain letters." });
    } else {
      setErrors({ ...errors, lastName: "" });
    }
  };

  return <CardContent className="flex flex-col gap-5">
    <Field>
      <FieldLabel htmlFor="firstName">First Name</FieldLabel>
      <FieldError>{errors.firstName}</FieldError>
      <Input
        id="firstName"
        type="text"
        value={formData.firstName}
        onChange={(e) => validateFirstName(e.target.value.trim())}
        placeholder="John"
        aria-invalid={!!errors.firstName}
        required
        />
    </Field>
    <Field>
      <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
      <FieldError>{errors.lastName}</FieldError>
      <Input
        id="lastName"
        type="text"
        value={formData.lastName}
        onChange={(e) => validateLastName(e.target.value.trim())}
        placeholder="Doe"
        aria-invalid={!!errors.lastName}
        required
        />
    </Field>
  </CardContent>
}
