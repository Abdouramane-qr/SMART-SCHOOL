import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", disabled, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50";
    const variants: Record<ButtonVariant, string> = {
      primary: "bg-primary text-primary-foreground hover:bg-primary/90",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      ghost: "text-foreground hover:bg-muted",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], className)}
        disabled={disabled}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("rounded-lg border border-border bg-card text-card-foreground shadow-sm", className)}
    {...props}
  />
));
Card.displayName = "Card";

type BadgeVariant = "success" | "info" | "warning" | "destructive";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "info", ...props }, ref) => {
    const variants: Record<BadgeVariant, string> = {
      success: "border-success/30 bg-success/10 text-success",
      info: "border-info/30 bg-info/10 text-info",
      warning: "border-warning/30 bg-warning/10 text-warning",
      destructive: "border-destructive/30 bg-destructive/10 text-destructive",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
));
Select.displayName = "Select";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

type AlertVariant = "default" | "success" | "info" | "warning" | "destructive";

type AlertProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: AlertVariant;
};

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variants: Record<AlertVariant, string> = {
      default: "border-border bg-card text-foreground",
      success: "border-success/30 bg-success/10 text-success",
      info: "border-info/30 bg-info/10 text-info",
      warning: "border-warning/30 bg-warning/10 text-warning",
      destructive: "border-destructive/30 bg-destructive/10 text-destructive",
    };

    return (
      <div
        ref={ref}
        role="alert"
        className={cn("rounded-md border px-4 py-3 text-sm", variants[variant], className)}
        {...props}
      />
    );
  }
);
Alert.displayName = "Alert";

export const SmartSchoolKitExamples = () => (
  <div className="space-y-6">
    <div className="flex flex-wrap gap-3">
      <Button>Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button disabled>Disabled</Button>
    </div>

    <Card className="space-y-4 p-6">
      <h3 className="text-lg font-semibold">SMART-SCHOOL Card</h3>
      <p className="text-sm text-muted-foreground">Exemple de carte basee sur les tokens.</p>
      <div className="flex flex-wrap gap-2">
        <Badge variant="success">Success</Badge>
        <Badge variant="info">Info</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="destructive">Destructive</Badge>
      </div>
    </Card>

    <div className="grid gap-4 md:grid-cols-2">
      <Input placeholder="Nom complet" />
      <Select defaultValue="">
        <option value="" disabled>
          Selectionner un role
        </option>
        <option value="admin">Admin</option>
        <option value="enseignant">Enseignant</option>
        <option value="eleve">Eleve</option>
      </Select>
      <Textarea placeholder="Message" className="md:col-span-2" />
    </div>

    <div className="grid gap-3 md:grid-cols-2">
      <Alert>Information generale pour SMART-SCHOOL.</Alert>
      <Alert variant="success">Operation terminee avec succes.</Alert>
      <Alert variant="warning">Attention: verifiez les donnees.</Alert>
      <Alert variant="destructive">Une erreur est survenue.</Alert>
    </div>
  </div>
);
