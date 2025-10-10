import { signIn } from "@junobuild/core";
import { FC } from "react";
import { Button } from "./Button";

export const Login: FC = () => {
  const handleSignIn = async () => {
    // Use id.ai domain for Internet Identity
    await signIn({
          internet_identity: {
            options: {
              domain: "id.ai",
              derivationOrigin: "https://afritokeni.com",
            },
          },
        });
  };
  
  return <Button onClick={handleSignIn}>Sign in</Button>;
};
