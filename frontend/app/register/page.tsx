"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import Spinner from "@/components/Spinner";
import { cn } from "@/lib/utils";

import FirstLastNameStep from "./steps/FirstLastNameStep";
import PasswordWithConfirmStep from "./steps/PasswordWithConfirmStep";
import UsernameEmailStep from "./steps/UsernameEmailStep";

export type FormData = {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  passwordConfirm: string;
};

export type FormErrors = {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  passwordConfirm: string;
};

export type StepProps = {
  formData: FormData;
  setFormData: (formData: FormData) => void;
  errors: FormErrors;
  setErrors: (formErrors: FormErrors) => void;
};

export const forbiddenUsernames = ["chat", "new", "notifications", "p", "profile", "register", "settings"];

export default function RegistrationPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<number>(1);
  const numberOfSteps: number = 3;

  const [formData, setFormData] = useState<FormData>({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    passwordConfirm: "",
  });

  const [errors, setErrors] = useState<FormErrors>({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    passwordConfirm: "",
  });

  const stepIsInvalid = () => {
    if (step === 1) {
      if (errors.username || errors.email || !formData.username || !formData.email) return true;
      return false;
    } else if (step === 2) {
      if (errors.firstName || errors.lastName || !formData.firstName || !formData.lastName) return true;
      return false;
    } else if (step === 3) {
      if (errors.password || errors.passwordConfirm || !formData.password || !formData.passwordConfirm) return true;
      return false;
    } else {
      return true;
    }
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    Object.values(errors).forEach(value => {
      if (value !== "") return;
    });

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/users/register/`,
        {
          email: formData.email,
          username: formData.username,
          first_name: formData.firstName,
          last_name: formData.lastName,
          password: formData.password,
        },
      );

      if (response.status === 201) {
        await login({
          email: formData.email,
          password: formData.password,
        });
        router.push("/");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        alert("Something went wrong, try again.");
      }
    }
  }

  if (loading) {
    return <>
      <title>Mole - Registration</title>
      <Spinner />
    </>
  }

  if (user) {
    router.push("/");
  }

  return <>
    <title>Mole - Registration</title>
    <main className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden bg-muted/20 px-4 py-10">
      <div aria-hidden className="pointer-events-none absolute -top-32 -left-32 size-96 rounded-full bg-primary/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-32 -bottom-32 size-96 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative mx-auto w-full max-w-md">
        <form onSubmit={handleFormSubmit}>
          <Card className="w-full shadow-sm">
            <CardHeader className="text-center">
              <CardTitle>Join our community!</CardTitle>
              <CardDescription>
                Already have an account?{" "}
                <Link href="/" className="font-medium text-primary underline-offset-4 hover:underline">Log in!</Link>
              </CardDescription>
            </CardHeader>

            <div className="px-4">
              <div className="mb-2 text-xs font-medium text-muted-foreground">
                Step {step} of {numberOfSteps}
              </div>
              <div className="flex gap-1.5" aria-hidden="true">
                {Array.from({ length: numberOfSteps }, (_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors",
                      index + 1 <= step ? "bg-primary" : "bg-primary/15",
                    )}
                  />
                ))}
              </div>
            </div>

            {step === 1 && <UsernameEmailStep
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              setErrors={setErrors}
              />}
            {step === 2 && <FirstLastNameStep
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              setErrors={setErrors}
              />}
            {step === 3 && <PasswordWithConfirmStep
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              setErrors={setErrors}
              />}
            <CardFooter className="gap-3">
              {step !== 1 && <Button type="button" variant="outline" onClick={() => setStep(step => step - 1)}>Back</Button>}
              {step === numberOfSteps
                ? <Button type="submit" className="flex-1" disabled={stepIsInvalid()}>Register</Button>
                : <Button type="button" className="flex-1" onClick={() => setStep(step => step + 1)} disabled={stepIsInvalid()}>Next</Button>}
            </CardFooter>
          </Card>
        </form>
      </div>
    </main>
  </>
}
