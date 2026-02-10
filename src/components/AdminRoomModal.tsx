'use client';

import { useState, ChangeEvent } from 'react';
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

interface AdminRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AdminRoomModal({ isOpen, onClose, onSuccess }: AdminRoomModalProps) {
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Upload automático ao selecionar o arquivo
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
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          capacity: Number(capacity),
          description,
          imageUrl, // Agora enviamos a URL do Spaces, não o Base64
        }),
      });

      if (!res.ok) throw new Error('Falha ao criar sala');

      toaster.create({
        title: 'Sucesso',
        description: 'Sala cadastrada com sucesso!',
        type: 'success',
      });

      onSuccess();
      handleClose();
    } catch (error) {
      toaster.create({
        title: 'Erro',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setCapacity('');
    setDescription('');
    setImageUrl('');
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && handleClose()} size="lg">
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>Cadastrar Nova Sala</Dialog.Title>
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
            <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
            <Button 
              colorPalette="blue" 
              onClick={handleSubmit} 
              loading={loading}
              disabled={uploadingImage} // Impede salvar enquanto faz upload
            >
              Salvar Sala
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}