import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    title: '🏦 API de Agendamento Bancário',
    description: 'Documentação interativa da API REST criada com Node.js, Express e TiDB Cloud.',
    version: '1.0.0'
  },
  host: 'localhost:3000',
  schemes: ['http'],
  // Configuração opcional para deixar o Swagger pronto para receber o Token JWT nos testes
  securityDefinitions: {
    bearerAuth: {
      type: 'apiKey',
      in: 'header',
      name: 'Authorization',
      description: 'Insira o token JWT no formato: Bearer SEU_TOKEN_GIGANTE'
    }
  }
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['./src/server.js']; // Aponta para onde estão suas rotas

// Executa o gerador
swaggerAutogen()(outputFile, endpointsFiles, doc).then(() => {
  console.log('Documentação do Swagger gerada com sucesso!');
});