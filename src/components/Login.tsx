import { signIn, InternetIdentityProvider } from "@junobuild/core";
import { FC } from "react";
import { Button } from "./Button";

export const Login: FC = () => {
  const handleSignIn = async () => {
    // Use id.ai domain for Internet Identity
    const provider = new InternetIdentityProvider({ domain: "id.ai" as any });
    await signIn({ provider });
  };
  
  return <Button onClick={handleSignIn}>Sign in</Button>;
};
