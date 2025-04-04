import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useLocation } from "wouter";
import { Loader2, LockIcon, AlertCircle, ArrowLeft, MoveLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// 1. Etapa de verificação de CPF/CNPJ
const cpfCnpjSchema = z.object({
  document: z
    .string()
    .min(11, "CPF/CNPJ inválido")
    .refine((value) => {
      const numbers = value.replace(/\D/g, "");
      return numbers.length === 11 || numbers.length === 14;
    }, "CPF/CNPJ inválido"),
});

// 2. Etapa de verificação de código
const verificationCodeSchema = z.object({
  code: z.string().length(6, "O código deve ter 6 dígitos"),
});

// 3. Etapa de nova senha
const newPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "A senha deve ter pelo menos 8 caracteres")
    .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula")
    .regex(/[0-9]/, "A senha deve conter pelo menos um número")
    .regex(/[^A-Za-z0-9]/, "A senha deve conter pelo menos um caractere especial"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type CpfCnpjValues = z.infer<typeof cpfCnpjSchema>;
type VerificationCodeValues = z.infer<typeof verificationCodeSchema>;
type NewPasswordValues = z.infer<typeof newPasswordSchema>;

enum RecoveryStep {
  REQUEST_CODE = 0,
  VERIFY_CODE = 1,
  RESET_PASSWORD = 2,
  SUCCESS = 3,
}

export default function RecoverPassword() {
  const [_, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState<RecoveryStep>(RecoveryStep.REQUEST_CODE);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [document, setDocument] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState<string>("");
  
  // Form para CPF/CNPJ
  const documentForm = useForm<CpfCnpjValues>({
    resolver: zodResolver(cpfCnpjSchema),
    defaultValues: {
      document: "",
    },
  });
  
  // Form para código de verificação
  const codeForm = useForm<VerificationCodeValues>({
    resolver: zodResolver(verificationCodeSchema),
    defaultValues: {
      code: "",
    },
  });
  
  // Form para nova senha
  const passwordForm = useForm<NewPasswordValues>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Mutation para solicitar código
  const requestCodeMutation = useMutation({
    mutationFn: async (data: CpfCnpjValues) => {
      const res = await apiRequest("POST", "/api/recover-password/request", {
        document: data.document.replace(/\D/g, ""),
      });
      return await res.json();
    },
    onSuccess: () => {
      setErrorMessage(null);
      setDocument(documentForm.getValues().document);
      setCurrentStep(RecoveryStep.VERIFY_CODE);
      setSuccessMessage("Código enviado com sucesso! Verifique seu e-mail.");
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || "CPF/CNPJ inválido ou não cadastrado. Por favor, verifique os dados informados.");
    },
  });

  // Mutation para verificar código
  const verifyCodeMutation = useMutation({
    mutationFn: async (data: VerificationCodeValues) => {
      const res = await apiRequest("POST", "/api/recover-password/verify", {
        document: document.replace(/\D/g, ""),
        code: data.code,
      });
      return await res.json();
    },
    onSuccess: () => {
      setErrorMessage(null);
      setVerificationCode(codeForm.getValues().code);
      setCurrentStep(RecoveryStep.RESET_PASSWORD);
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || "Código inválido ou expirado! Por favor, solicite um novo código.");
    },
  });

  // Mutation para definir nova senha
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: NewPasswordValues) => {
      const res = await apiRequest("POST", "/api/recover-password/reset", {
        document: document.replace(/\D/g, ""),
        code: verificationCode,
        password: data.password,
      });
      return await res.json();
    },
    onSuccess: () => {
      setErrorMessage(null);
      setSuccessMessage("Senha alterada com sucesso!");
      setCurrentStep(RecoveryStep.SUCCESS);
      // Redireciona para login após 3 segundos
      setTimeout(() => {
        navigate("/auth");
      }, 3000);
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || "As senhas não coincidem ou não atendem aos requisitos de segurança. Tente novamente.");
    },
  });

  // Handler para formulário de CPF/CNPJ
  const onRequestCodeSubmit = (data: CpfCnpjValues) => {
    setErrorMessage(null);
    requestCodeMutation.mutate(data);
  };

  // Handler para formulário de código de verificação
  const onVerifyCodeSubmit = (data: VerificationCodeValues) => {
    setErrorMessage(null);
    verifyCodeMutation.mutate(data);
  };

  // Handler para formulário de nova senha
  const onResetPasswordSubmit = (data: NewPasswordValues) => {
    setErrorMessage(null);
    resetPasswordMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg overflow-hidden p-6">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-4" 
            onClick={() => navigate("/auth")}
          >
            <MoveLeft className="mr-2 h-4 w-4" />
            Voltar para login
          </Button>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
              <LockIcon className="h-6 w-6 text-gray-700" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Recuperação de Senha</h1>
            <p className="text-sm text-gray-500 mt-1 mb-4">
              {currentStep === RecoveryStep.REQUEST_CODE && "Informe seu CPF/CNPJ para verificação"}
              {currentStep === RecoveryStep.VERIFY_CODE && "Digite o código de verificação enviado"}
              {currentStep === RecoveryStep.RESET_PASSWORD && "Defina sua nova senha"}
              {currentStep === RecoveryStep.SUCCESS && "Senha alterada com sucesso!"}
            </p>
          </div>
        </div>
        
        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        
        {successMessage && (
          <Alert className="mb-4 bg-green-50 text-green-800 border border-green-100">
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        {/* Passo 1: Formulário de CPF/CNPJ */}
        {currentStep === RecoveryStep.REQUEST_CODE && (
          <Form {...documentForm}>
            <form onSubmit={documentForm.handleSubmit(onRequestCodeSubmit)} className="space-y-4">
              <FormField
                control={documentForm.control}
                name="document"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF/CNPJ</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Digite seu CPF ou CNPJ" 
                        {...field} 
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          if (value.length <= 14) {
                            field.onChange(value);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={requestCodeMutation.isPending}
              >
                {requestCodeMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Solicitar Código
              </Button>
            </form>
          </Form>
        )}

        {/* Passo 2: Código de Verificação */}
        {currentStep === RecoveryStep.VERIFY_CODE && (
          <Form {...codeForm}>
            <form onSubmit={codeForm.handleSubmit(onVerifyCodeSubmit)} className="space-y-4">
              <FormField
                control={codeForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código de Verificação</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Digite o código de 6 dígitos" 
                        maxLength={6}
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          if (value.length <= 6) {
                            field.onChange(value);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setCurrentStep(RecoveryStep.REQUEST_CODE)}
                >
                  Voltar
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1" 
                  disabled={verifyCodeMutation.isPending}
                >
                  {verifyCodeMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Verificar
                </Button>
              </div>
              
              <div className="text-center pt-2">
                <Button 
                  type="button" 
                  variant="link" 
                  className="text-sm" 
                  onClick={() => {
                    setErrorMessage(null);
                    requestCodeMutation.mutate({ document });
                  }}
                  disabled={requestCodeMutation.isPending}
                >
                  {requestCodeMutation.isPending && (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  )}
                  Reenviar código
                </Button>
              </div>
            </form>
          </Form>
        )}

        {/* Passo 3: Nova Senha */}
        {currentStep === RecoveryStep.RESET_PASSWORD && (
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onResetPasswordSubmit)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Digite sua nova senha" {...field} />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-gray-500 mt-1">
                      A senha deve ter no mínimo 8 caracteres, uma letra maiúscula, um número e um caractere especial.
                    </p>
                  </FormItem>
                )}
              />
              
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirme a Nova Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Confirme sua nova senha" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setCurrentStep(RecoveryStep.VERIFY_CODE)}
                >
                  Voltar
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1" 
                  disabled={resetPasswordMutation.isPending}
                >
                  {resetPasswordMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Alterar Senha
                </Button>
              </div>
            </form>
          </Form>
        )}

        {/* Passo 4: Sucesso */}
        {currentStep === RecoveryStep.SUCCESS && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-600 font-medium">Senha alterada com sucesso!</p>
            <p className="text-sm text-gray-500 mt-1 mb-4">
              Você será redirecionado para a tela de login em instantes...
            </p>
            <Button
              type="button"
              onClick={() => navigate("/auth")}
              className="mt-2"
            >
              Ir para Login
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}