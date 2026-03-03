'use client';

import { useState, useEffect } from 'react';
import { 
  Dialog, Button, Input, Textarea, Stack, Field, Flex, SimpleGrid, Icon, Box, Center, Spinner, Text, Image
} from '@chakra-ui/react';
import { toaster } from '@/components/ui/toaster';
import { LuWifi, LuMonitorPlay, LuCoffee, LuPresentation, LuVideo, LuAccessibility, LuImagePlus, LuX } from 'react-icons/lu';

interface Room {
  id?: string;
  name: string;
  capacity: number;
  description: string;
  isActive: boolean;
  imageUrl?: string;
  amenities?: string[];
}

interface AdminRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  roomToEdit: Room | null;
}

const AVAILABLE_AMENITIES = [
  { id: 'Wi-Fi de alta velocidade', icon: LuWifi },
  { id: 'TV / Projetor HDMI', icon: LuMonitorPlay },
  { id: 'Água e Café', icon: LuCoffee },
  { id: 'Quadro Branco', icon: LuPresentation },
  { id: 'Videoconferência', icon: LuVideo },
  { id: 'Acessibilidade', icon: LuAccessibility },
];

export default function AdminRoomModal({ isOpen, onClose, onSuccess, roomToEdit }: AdminRoomModalProps) {
  const [formData, setFormData] = useState<Room>({
    name: '',
    capacity: 4,
    description: '',
    isActive: true,
    imageUrl: '',
    amenities: [],
  });
  
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false); // Estado para controlar o loading da imagem

  useEffect(() => {
    if (roomToEdit) {
      setFormData({
        ...roomToEdit,
        amenities: roomToEdit.amenities || [],
      });
    } else {
      setFormData({
        name: '', capacity: 4, description: '', isActive: true, imageUrl: '', amenities: []
      });
    }
  }, [roomToEdit, isOpen]);

  const toggleAmenity = (amenityId: string) => {
    setFormData(prev => {
      const current = prev.amenities || [];
      if (current.includes(amenityId)) {
        return { ...prev, amenities: current.filter(a => a !== amenityId) };
      } else {
        return { ...prev, amenities: [...current, amenityId] };
      }
    });
  };

  // ------------------------------------------------------------------
  // NOVA FUNÇÃO: Faz o upload real da imagem para o Digital Ocean
  // ------------------------------------------------------------------
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toaster.create({ title: 'Apenas imagens são permitidas', type: 'error' });
      return;
    }

    setUploadingImage(true);
    const formDataPayload = new FormData();
    formDataPayload.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataPayload,
      });

      if (!res.ok) throw new Error('Falha no upload');

      const data = await res.json();
      
      // Salva a URL retornada pela API no estado do formulário
      setFormData(prev => ({ ...prev, imageUrl: data.url }));
      toaster.create({ title: 'Imagem enviada com sucesso', type: 'success' });
      
    } catch (error) {
      console.error(error);
      toaster.create({ title: 'Erro ao enviar imagem', type: 'error' });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.capacity) {
      toaster.create({ title: 'Preencha os campos obrigatórios', type: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const url = formData.id ? `/api/rooms?id=${formData.id}` : '/api/rooms';
      const method = formData.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          capacity: Number(formData.capacity)
        }),
      });

      if (!res.ok) throw new Error('Falha ao salvar a sala');

      toaster.create({ title: 'Sala salva com sucesso!', type: 'success' });
      onSuccess();
      onClose();
    } catch (error) {
      toaster.create({ title: 'Erro ao salvar', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
      <Dialog.Backdrop bg="blackAlpha.600" backdropFilter="blur(2px)" />
      <Dialog.Positioner>
        <Dialog.Content maxW="lg" borderRadius="xl">
          <Dialog.Header>
            <Dialog.Title>{roomToEdit ? 'Editar Sala' : 'Nova Sala'}</Dialog.Title>
          </Dialog.Header>
          <Dialog.CloseTrigger />
          
          <Dialog.Body>
            <Stack gap={4}>
              
              {/* O UPLOAD DE IMAGEM MODERNO VOLTOU AQUI */}
              <Field.Root>
                <Field.Label>Foto da Sala</Field.Label>
                
                {!formData.imageUrl ? (
                  <Box 
                    borderWidth="2px" 
                    borderStyle="dashed" 
                    borderColor="border.muted" 
                    borderRadius="md" 
                    p={6} 
                    textAlign="center"
                    cursor={uploadingImage ? "wait" : "pointer"}
                    onClick={() => !uploadingImage && document.getElementById('fileInput')?.click()}
                    _hover={{ bg: "bg.subtle" }}
                    position="relative"
                  >
                    <input 
                      id="fileInput" 
                      type="file" 
                      accept="image/*" 
                      hidden 
                      onChange={handleImageUpload} 
                      disabled={uploadingImage}
                    />
                    {uploadingImage ? (
                      <Center flexDirection="column">
                        <Spinner size="md" color="blue.500" mb={2} />
                        <Text fontSize="sm" color="fg.muted">Enviando para nuvem...</Text>
                      </Center>
                    ) : (
                      <>
                        <LuImagePlus size={24} style={{ margin: '0 auto' }} color="gray" />
                        <Text fontSize="sm" mt={2} color="fg.muted">Clique para adicionar uma imagem</Text>
                      </>
                    )}
                  </Box>
                ) : (
                  <Box position="relative" mt={2}>
                    <Image 
                      src={formData.imageUrl} 
                      alt="Preview" 
                      borderRadius="md" 
                      maxHeight="200px" 
                      objectFit="cover" 
                      w="full" 
                    />
                    <Button 
                      size="xs" 
                      position="absolute" 
                      top={2} 
                      right={2} 
                      colorPalette="red"
                      onClick={() => setFormData({...formData, imageUrl: ''})}
                    >
                      <LuX /> Remover
                    </Button>
                  </Box>
                )}
              </Field.Root>

              <Field.Root required>
                <Field.Label>Nome da Sala</Field.Label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </Field.Root>

              <Field.Root required>
                <Field.Label>Capacidade (Pessoas)</Field.Label>
                <Input type="number" min={1} value={formData.capacity} onChange={e => setFormData({...formData, capacity: Number(e.target.value)})} />
              </Field.Root>

              <Field.Root>
                <Field.Label>Descrição</Field.Label>
                <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </Field.Root>

              {/* Seção das Comodidades (Amenities) */}
              <Field.Root>
                <Field.Label mb={2}>O que este espaço oferece?</Field.Label>
                <SimpleGrid columns={2} gap={2}>
                  {AVAILABLE_AMENITIES.map((amenity) => {
                    const isActive = formData.amenities?.includes(amenity.id);
                    return (
                      <Button
                        key={amenity.id}
                        variant={isActive ? 'solid' : 'outline'}
                        colorPalette={isActive ? 'blue' : 'gray'}
                        size="sm"
                        justifyContent="flex-start"
                        onClick={() => toggleAmenity(amenity.id)}
                      >
                        <Icon as={amenity.icon} mr={2} />
                        {amenity.id}
                      </Button>
                    );
                  })}
                </SimpleGrid>
              </Field.Root>

            </Stack>
          </Dialog.Body>

          <Dialog.Footer mt={4}>
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button colorPalette="blue" onClick={handleSubmit} loading={loading}>
              Salvar Sala
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}