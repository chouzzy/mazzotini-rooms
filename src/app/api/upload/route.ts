import { NextResponse } from 'next/server';
import { s3Client } from '@/lib/s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Apenas imagens são permitidas' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Variáveis de Ambiente
    const bucketName = process.env.SPACES_BUCKET_NAME;
    const appFolder = process.env.SPACES_APP_FOLDER || 'uploads'; // Fallback se não tiver env
    const endpointHost = process.env.SPACES_ENDPOINT || 'nyc3.digitaloceanspaces.com';

    // Gerar nome único para o arquivo
    const fileName = `${Date.now()}-${file.name.replace(/\s/g, '-')}`;
    
    // Caminho final: pasta_do_app/rooms/nome_arquivo.jpg
    const key = `${appFolder}/rooms/${fileName}`;
    
    // Upload para o Digital Ocean Spaces
    const bucketParams = {
      Bucket: bucketName,
      Key: key, 
      Body: buffer,
      ContentType: file.type,
      ACL: 'public-read' as const, // Torna o arquivo público para visualização
    };

    await s3Client.send(new PutObjectCommand(bucketParams));

    // Montar a URL pública
    // Formato padrão DO: https://{bucket}.{endpoint}/{key}
    const url = `https://${bucketName}.${endpointHost}/${key}`;

    return NextResponse.json({ url });

  } catch (error) {
    console.error('Erro no upload:', error);
    return NextResponse.json({ error: 'Erro interno ao processar upload' }, { status: 500 });
  }
}