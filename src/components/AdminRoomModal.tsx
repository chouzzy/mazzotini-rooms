'use client';

import { useState, ChangeEvent, useEffect } from 'react';
import {
  Dialog,
  Button,
  Input,
  Stack,
  Textarea,
  Image,
  Box,
  Field,
  Spinner,
  Center,
  Text
} from '@chakra-ui/react';
import { LuImagePlus, LuX } from "react-icons/lu";
import { toaster } from './ui/toaster';

// Interface local (idealmente estaria em types/index.ts, mas mantemos aqui pela simplicidade do MVP)
interface Room {
  id: string;
  name: string;
  capacity: number;
  description: string;
  isActive: boolean;
  imageUrl?: string;
}

interface AdminRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  roomToEdit?: Room | null; // Nova prop opcional
}

export default function AdminRoomModal({ isOpen, onClose, onSuccess, roomToEdit }: AdminRoomModalProps) {
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Estados do Formulário
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Efeito para carregar dados quando o modal abre
  useEffect(() => {
    if (isOpen) {
      if (roomToEdit) {
        // Modo Edição: Preenche com dados existentes
        setName(roomToEdit.name);
        setCapacity(roomToEdit.capacity.toString());
        setDescription(roomToEdit.description || '');
        setImageUrl(roomToEdit.imageUrl || '');
        setIsActive(roomToEdit.isActive);
      } else {
        // Modo Criação: Limpa tudo
        setName('');
        setCapacity('');
        setDescription('');
        setImageUrl('');
        setIsActive(true);
      }
    }
  }, [isOpen, roomToEdit]);

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Falha no upload da imagem');

      const data = await res.json();
      setImageUrl(data.url);
      
      toaster.create({
        title: 'Imagem carregada',
        type: 'success',
      });
    } catch (error) {
      toaster.create({
        title: 'Erro no upload',
        description: 'Não foi possível enviar a imagem para o servidor.',
        type: 'error',
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    if (!name || !capacity) {
      toaster.create({
        title: 'Campos obrigatórios',
        description: 'Nome e Capacidade são necessários.',
        type: 'warning',
      });
      return;
    }

    setLoading(true);
    try {
      // Decide se é POST (Criar) ou PUT (Atualizar)
      const method = roomToEdit ? 'PUT' : 'POST';
      
      const body: any = {
        name,
        capacity: Number(capacity),
        description,
        imageUrl,
        isActive
      };

      // Se for edição, precisamos enviar o ID
      if (roomToEdit) {
        body.id = roomToEdit.id;
      }

      const res = await fetch('/api/rooms', {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`Falha ao ${roomToEdit ? 'atualizar' : 'criar'} sala`);

      toaster.create({
        title: 'Sucesso',
        description: `Sala ${roomToEdit ? 'atualizada' : 'cadastrada'} com sucesso!`,
        type: 'success',
      });

      onSuccess();
      onClose(); // Não limpamos manualmente aqui pois o useEffect cuida disso ao reabrir
    } catch (error) {
      toaster.create({
        title: 'Erro',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()} size="lg">
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>{roomToEdit ? 'Editar Sala' : 'Cadastrar Nova Sala'}</Dialog.Title>
          </Dialog.Header>
          <Dialog.CloseTrigger />
          
          <Dialog.Body>
            <Stack gap={4}>
              <Field.Root required>
                <Field.Label>Nome da Sala</Field.Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Sala de Vidro" />
              </Field.Root>

              <Field.Root required>
                <Field.Label>Capacidade</Field.Label>
                <Input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="Ex: 8" />
              </Field.Root>

              <Field.Root>
                <Field.Label>Descrição</Field.Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalhes da sala..." />
              </Field.Root>

              {/* Campo de Status (Ativa/Inativa) */}
              <Field.Root>
                 <Field.Label>Status</Field.Label>
                 <Box 
                   as="label" 
                   display="flex" 
                   alignItems="center" 
                   cursor="pointer" 
                   gap={3}
                   borderWidth="1px"
                   borderRadius="md"
                   p={3}
                   _hover={{ bg: "bg.subtle" }}
                 >
                   <input 
                     type="checkbox" 
                     checked={isActive} 
                     onChange={(e) => setIsActive(e.target.checked)}
                     style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                   />
                   <Box as="span" fontWeight="medium" fontSize="sm">
                     Sala Ativa (Disponível para reservas)
                   </Box>
                 </Box>
              </Field.Root>

              <Field.Root>
                <Field.Label>Foto da Sala</Field.Label>
                
                {!imageUrl ? (
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
                        <Text fontSize="sm" color="fg.muted">Enviando para Digital Ocean...</Text>
                      </Center>
                    ) : (
                      <>
                        <LuImagePlus size={24} style={{ margin: '0 auto' }} />
                        <Text fontSize="sm" mt={2} color="fg.muted">Clique para adicionar uma imagem</Text>
                      </>
                    )}
                  </Box>
                ) : (
                  <Box position="relative" mt={2}>
                    <Image src={imageUrl} alt="Preview" borderRadius="md" maxHeight="200px" objectFit="cover" w="full" />
                    <Button 
                      size="xs" 
                      position="absolute" 
                      top={2} 
                      right={2} 
                      colorPalette="red"
                      onClick={() => setImageUrl('')}
                    >
                      <LuX /> Remover
                    </Button>
                  </Box>
                )}
              </Field.Root>
            </Stack>
          </Dialog.Body>

          <Dialog.Footer>
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button 
              colorPalette="blue" 
              onClick={handleSubmit} 
              loading={loading}
              disabled={uploadingImage}
            >
              {roomToEdit ? 'Atualizar Sala' : 'Salvar Sala'}
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}