import 'dotenv/config'; // Garante que as variáveis de ambiente carreguem antes de tudo
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt'; // <-- ADICIONADO IMPORT DO BCRYPT AQUI
import swaggerUi from 'swagger-ui-express'; // <-- ADICIONADO AQUI
import fs from 'fs';


// Imports dos seus Models
import { 
  buscarTodosClientes, 
  criarCliente, 
  buscarClienteEmail, 
  buscarClienteNome, 
  atualizarCliente, 
  deletarCliente 
} from '../models/clienteModel.js';

import { 
  criarAgendamento, 
  buscarTodosAgendamentos 
} from '../models/agendamentoModel.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// --- CONFIGURAÇÃO DO SWAGGER ---
let swaggerDocument = {};
try {
  swaggerDocument = JSON.parse(fs.readFileSync('./swagger-output.json', 'utf8'));
} catch (error) {
  console.log("Aviso: arquivo swagger-output.json ainda não foi gerado.");
}
app.use('/doc', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


// ==========================================
// ROTAS DE CLIENTES
// ==========================================

// 1. Rota para listar todos os clientes (GET)
app.get('/clientes', async (req, res) => {
  try {
    const clientes = await buscarTodosClientes();
    res.json(clientes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao listar clientes' });
  }
});

// 2. Rota para cadastrar um novo cliente (POST)
app.post('/clientes', async (req, res) => {
  try {
    const { nome, email, senha, data_nascimento } = req.body;
    
    if (!nome || !email || !senha || !data_nascimento) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    const newId = await criarCliente(nome, email, senha, data_nascimento);
    res.status(201).json({ message: 'Cliente criado com sucesso', id: newId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar cliente' });
  }
});

// 3. Rota para buscar cliente por Email (GET via Query String)
app.get('/clientes/busca-email', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'O parâmetro email é obrigatório' });
    }

    const cliente = await buscarClienteEmail(email);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    // Remove a senha do objeto antes de enviar a resposta por segurança
    delete cliente.senha;
    res.json(cliente);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar cliente por email' });
  }
});

// 4. Rota para buscar clientes por Nome (GET via Query String)
app.get('/clientes/busca-nome', async (req, res) => {
  try {
    const { nome } = req.query;
    if (!nome) {
      return res.status(400).json({ error: 'O parâmetro nome é obrigatório' });
    }

    const clientes = await buscarClienteNome(nome);
    res.json(clientes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar clientes por nome' });
  }
});

// 5. Rota para atualizar um cliente por ID (PUT)
app.put('/clientes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, senha, data_nascimento } = req.body;

    const atualizado = await atualizarCliente(id, nome, email, senha, data_nascimento);
    
    if (!atualizado) {
      return res.status(404).json({ error: 'Cliente não encontrado para atualização' });
    }

    res.json({ message: 'Cliente atualizado com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar cliente' });
  }
});

// 6. Rota para deletar um cliente por ID (DELETE)
app.delete('/clientes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deletado = await deletarCliente(id);
    
    if (!deletado) {
      return res.status(404).json({ error: 'Cliente não encontrado para exclusão' });
    }

    res.json({ message: 'Cliente deletado com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao deletar cliente' });
  }
});

// ==========================================
// ROTAS DE AGENDAMENTOS
// ==========================================

// 1. Rota para listar todos os agendamentos (GET)
app.get('/agendamentos', async (req, res) => {
  try {
    const agendamentos = await buscarTodosAgendamentos();
    res.json(agendamentos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao listar agendamentos' });
  }
});

// 2. Rota para criar agendamento (POST)
app.post('/agendamentos', async (req, res) => {
  try {
    const { data_agendamento, horario, servico, descricao, cliente_id } = req.body;

    if (!data_agendamento || !horario || !servico || !cliente_id) {
      return res.status(400).json({ error: 'Data, horário, serviço e cliente_id são obrigatórios.' });
    }

    const novoAgendamentoId = await criarAgendamento(data_agendamento, horario, servico, descricao, cliente_id);
    
    res.status(201).json({ 
      message: 'Agendamento realizado com sucesso!', 
      id: novoAgendamentoId 
    });
  } catch (error) {
    console.error(error);
    
    if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.errno === 1452) {
      return res.status(400).json({ error: 'Erro: O cliente_id fornecido não existe.' });
    }

    res.status(500).json({ error: 'Erro ao criar agendamento' });
  }
});

// ==========================================
// ROTA DE AUTENTICAÇÃO (LOGIN) - CORRIGIDA!
// ==========================================
app.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    const cliente = await buscarClienteEmail(email);

    // Se o cliente não existir, já barra aqui
    if (!cliente) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }

    // CORREÇÃO: Compara a senha digitada com a senha criptografada do banco
    const senhaCorreta = await bcrypt.compare(senha, cliente.senha);

    if (!senhaCorreta) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }

    const payload = {
      id: cliente.id,
      nome: cliente.nome,
      email: cliente.email
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' });

    res.json({
      message: 'Login realizado com sucesso!',
      token: token
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno ao processar o login.' });
  } 
});

// Inicialização do Servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});