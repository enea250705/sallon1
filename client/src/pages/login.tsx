import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Scissors, User, Lock, Sparkles, Heart } from "lucide-react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(username, password);
      toast({
        title: "Benvenuta! 💇‍♀️",
        description: "Accesso effettuato con successo al tuo salone!",
      });
    } catch (error) {
      toast({
        title: "Errore di accesso",
        description: "Username o password non validi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-4 rounded-full shadow-lg">
                  <Scissors className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1">
                  <Sparkles className="h-5 w-5 text-yellow-400 animate-pulse" />
                </div>
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                Salone di Bellezza
              </h1>
              <p className="text-gray-600 mt-2">Sistema di Gestione Professionale</p>
            </div>
          </div>

          {/* Login Form */}
          <div className="bg-gray-50 rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Benvenuta!</h2>
              <p className="text-gray-600 mt-1">Accedi al tuo account per iniziare</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={isLoading}
                    className="pl-10 h-12 border-gray-200 focus:border-pink-500 focus:ring-pink-500 rounded-lg"
                    placeholder="Inserisci il tuo username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="pl-10 h-12 border-gray-200 focus:border-pink-500 focus:ring-pink-500 rounded-lg"
                    placeholder="Inserisci la tua password"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Accesso in corso...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>Accedi al Salone</span>
                    <Heart className="h-5 w-5" />
                  </div>
                )}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800 font-medium mb-2">🔑 Credenziali Demo:</p>
              <div className="text-sm text-blue-700 space-y-1">
                <p><strong>Username:</strong> admin</p>
                <p><strong>Password:</strong> admin123</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500">
            <p>© 2024 Sistema Gestione Salone</p>
            <p className="mt-1">Fatto con ❤️ per il tuo business</p>
          </div>
        </div>
      </div>

      {/* Right Side - Beautiful Background */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600"></div>
        
        {/* Decorative Elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full blur-xl"></div>
          <div className="absolute top-40 right-32 w-24 h-24 bg-yellow-300 rounded-full blur-lg"></div>
          <div className="absolute bottom-32 left-32 w-40 h-40 bg-pink-300 rounded-full blur-2xl"></div>
          <div className="absolute bottom-20 right-20 w-28 h-28 bg-purple-300 rounded-full blur-xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12 text-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl font-bold leading-tight">
                Gestisci il tuo<br />
                <span className="text-yellow-300">Salone di Bellezza</span>
              </h2>
              <p className="text-xl text-pink-100 max-w-md">
                Sistema completo per appuntamenti, clienti e promemoria automatici
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 max-w-sm">
              <div className="flex items-center space-x-3 text-pink-100">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Scissors className="h-6 w-6" />
                </div>
                <span>Gestione Appuntamenti</span>
              </div>
              <div className="flex items-center space-x-3 text-pink-100">
                <div className="bg-white/20 p-2 rounded-lg">
                  <User className="h-6 w-6" />
                </div>
                <span>Database Clienti</span>
              </div>
              <div className="flex items-center space-x-3 text-pink-100">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Sparkles className="h-6 w-6" />
                </div>
                <span>Promemoria Automatici</span>
              </div>
            </div>

            <div className="text-pink-200 text-sm">
              "La bellezza inizia con un buon sistema di gestione"
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-1/4 left-1/4 animate-bounce">
          <div className="bg-white/10 p-3 rounded-full backdrop-blur-sm">
            <Scissors className="h-8 w-8 text-white" />
          </div>
        </div>
        <div className="absolute top-1/3 right-1/4 animate-pulse">
          <div className="bg-white/10 p-3 rounded-full backdrop-blur-sm">
            <Sparkles className="h-8 w-8 text-yellow-300" />
          </div>
        </div>
        <div className="absolute bottom-1/3 left-1/3 animate-ping">
          <div className="bg-white/10 p-3 rounded-full backdrop-blur-sm">
            <Heart className="h-8 w-8 text-pink-300" />
          </div>
        </div>
      </div>
    </div>
  );
}