import type { ReactElement } from "react";
import LoginPageView from "@/features/auth/pages/login-page";

/**
 * Defines the `/login` route in the Next.js App Router.
 * @returns {ReactElement} Login route page
 */
export default function LoginPage(): ReactElement {
  return <LoginPageView />;
}
