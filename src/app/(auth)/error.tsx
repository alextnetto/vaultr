"use client";

import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AuthError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="max-w-md w-full text-center">
        <CardContent className="py-12">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-6">
            An unexpected error occurred. Please try again.
          </p>
          <Button onClick={reset}>Try Again</Button>
        </CardContent>
      </Card>
    </div>
  );
}
