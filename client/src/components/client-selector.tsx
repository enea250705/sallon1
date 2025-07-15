import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, User, Phone } from 'lucide-react';
import { formatPhoneForDisplay } from '@/lib/phone-utils';

interface Client {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
}

interface ClientSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectClient: (client: Client) => void;
  clients: Client[];
}

export function ClientSelector({ isOpen, onClose, onSelectClient, clients }: ClientSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);

  useEffect(() => {
    if (!clients) {
      setFilteredClients([]);
      return;
    }

    if (!searchTerm.trim()) {
      setFilteredClients(clients);
      return;
    }

    const filtered = clients.filter(client => {
      const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
      const phone = client.phone.toLowerCase();
      const search = searchTerm.toLowerCase();
      
      return fullName.includes(search) || phone.includes(search);
    });

    setFilteredClients(filtered);
  }, [searchTerm, clients]);

  const handleSelectClient = (client: Client) => {
    onSelectClient(client);
    setSearchTerm('');
    onClose();
  };

  const handleClose = () => {
    setSearchTerm('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md w-full mx-4 max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Seleziona Cliente</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col space-y-4 flex-1 min-h-0">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cerca per nome o telefono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12"
              autoFocus
            />
          </div>

          {/* Results Count */}
          <div className="text-sm text-gray-600">
            {filteredClients.length} clienti trovati
          </div>

          {/* Clients List */}
          <div className="flex-1 overflow-y-auto border rounded-lg bg-gray-50">
            {filteredClients.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">Nessun cliente trovato</p>
                <p className="text-sm">
                  {searchTerm ? 'Prova a modificare la ricerca' : 'Non ci sono clienti nella rubrica'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredClients.map((client) => (
                  <div
                    key={client.id}
                    className="p-4 hover:bg-blue-50 cursor-pointer transition-colors border-l-4 border-transparent hover:border-blue-500"
                    onClick={() => handleSelectClient(client)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 text-lg">
                          {client.firstName} {client.lastName}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">{formatPhoneForDisplay(client.phone)}</span>
                        </div>
                        {client.email && (
                          <div className="text-sm text-gray-500 mt-1">
                            {client.email}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-bold text-sm">
                            {client.firstName.charAt(0)}{client.lastName.charAt(0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Annulla
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 