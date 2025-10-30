// scripts/generate-openapi.ts
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { AppModule } from '../src/app.module';

async function generateOpenAPISpec() {
  const app = await NestFactory.create(AppModule);

  // Set global prefix to match runtime configuration
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('EasyGenerator Authentication API')
    .setDescription('Authentication API with JWT and MongoDB')
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth('refresh_token', {
      type: 'http',
      in: 'cookie',
      description: 'HttpOnly cookie containing refresh token',
    })
    .addTag('authentication', 'User authentication endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('health', 'Health check endpoint')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const outputPath = join(process.cwd(), 'openapi-spec.json');
  writeFileSync(outputPath, JSON.stringify(document, null, 2));

  console.log(`✅ OpenAPI spec generated at: ${outputPath}`);

  await app.close();
}

generateOpenAPISpec().catch((error) => {
  console.error('❌ Failed to generate OpenAPI spec:', error);
  process.exit(1);
});
