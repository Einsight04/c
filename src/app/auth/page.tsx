"use client";

import { useForm } from "react-hook-form";
import {
  ExclamationCircleIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useBayun } from "./bayun-client";
import { useState } from "react";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function SignIn() {
  const [spinner, setSpinner] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(
      z.object({
        username: z.string().min(1, { message: "Username is required" }),
        password: z.string().min(1, { message: "Password is required" }),
      }),
    ),
  });

  const bayun = useBayun();

  async function handleBayunLogin(username: string, password: string) {
    setSpinner(true);
    bayun.signIn(username, password);
    setTimeout(() => router.push("/"), 2000);
  }

  return (
    <>
      <div className="flex min-h-full items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <h2 className="mt-6 text-center text-xl font-medium uppercase tracking-wider text-gray-500">
            Sign in to your account
          </h2>
          <form
            className="mt-8 space-y-6"
            onSubmit={handleSubmit(async (values) => {
              const { username, password } = values;
              await handleBayunLogin(username, password);
            })}
          >
            <div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
              <div className="sm:col-span-6">
                <div className="flex justify-between">
                  <label
                    htmlFor="username"
                    className="flex text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    Username
                  </label>
                  {errors.username && (
                    <div className="flex text-xs font-medium uppercase tracking-wider text-red-600">
                      {errors.username?.message as string}
                    </div>
                  )}
                </div>
                <div className="relative mt-1 rounded-md shadow-sm">
                  <input
                    {...register("username")}
                    name="username"
                    type="text"
                    placeholder="Username"
                    className={classNames(
                      "block w-full appearance-none rounded-md px-3 py-2 placeholder-gray-400 shadow-sm outline-none sm:text-sm",
                      errors.username
                        ? "border-2 border-red-300 placeholder-red-300 focus:border-red-500"
                        : "border-2 border-gray-300 placeholder-gray-500 focus:border-indigo-500",
                    )}
                  />
                  {errors.username && (
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <ExclamationCircleIcon
                        className="h-5 w-5 text-red-500"
                        aria-hidden="true"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="block sm:col-span-6">
                <div className="flex justify-between">
                  <label
                    htmlFor="password"
                    className="flex text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    Password
                  </label>
                  {errors.password && (
                    <div className="flex text-xs font-medium uppercase tracking-wider text-red-600">
                      {errors.password?.message as string}
                    </div>
                  )}
                </div>
                <div className="relative mt-1 rounded-md shadow-sm">
                  <input
                    {...register("password")}
                    name="password"
                    placeholder="Password"
                    type="password"
                    className={classNames(
                      "block w-full appearance-none rounded-md px-3 py-2 placeholder-gray-400 shadow-sm outline-none sm:text-sm",
                      errors.password
                        ? "border-2 border-red-300 placeholder-red-300 focus:border-red-500"
                        : "border-2 border-gray-300 placeholder-gray-500 focus:border-indigo-500",
                    )}
                  />
                  {errors.password && (
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <ExclamationCircleIcon
                        className="h-5 w-5 text-red-500"
                        aria-hidden="true"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                // disabled={isSubmitting}
                className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-300"
              >
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <LockClosedIcon
                    className={classNames(
                      "h-5 w-5",
                    )}
                    aria-hidden="true"
                  />
                </span>
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
