import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { autenticarToken } from './middlewares/auth.js';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';

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

// --- CORS ---
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// --- SWAGGER ---
let swaggerDocument = {};
try {
  swaggerDocument = JSON.parse(fs.readFileSync('./swagger-output.json', 'utf8'));
} catch (error) {
  console.warn("Aviso: arquivo swagger-output.json ainda não foi gerado.");
}
app.use('/doc', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


// ==========================================
// ROTAS DE AUTENTICAÇÃO
// ==========================================

app.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    const cliente = await buscarClienteEmail(email);

    if (!cliente) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }

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
      token
    });

  } catch (error) {
    console.error('[POST /login]', error);
    res.status(500).json({ error: 'Erro interno ao processar o login.' });
  }
});


// ==========================================
// ROTAS DE CLIENTES
// ==========================================

// 1. Listar todos os clientes — protegida
app.get('/clientes', autenticarToken, async (req, res) => {
  try {
    const clientes = await buscarTodosClientes();
    res.json(clientes);
  } catch (error) {
    console.error('[GET /clientes]', error);
    res.status(500).json({ error: 'Erro ao listar clientes' });
  }
});

// 2. Cadastrar um novo cliente — pública (necessário para registro)
app.post('/clientes', async (req, res) => {
  try {
    const { nome, email, senha, data_nascimento } = req.body;

    if (!nome || !email || !senha || !data_nascimento) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    const newId = await criarCliente(nome, email, senha, data_nascimento);

    res.status(201).json({ message: 'Cliente criado com sucesso', id: newId });
  } catch (error) {
    console.error('[POST /clientes]', error);
    res.status(500).json({ error: 'Erro ao criar cliente' });
  }
});

// 3. Buscar cliente por e-mail — protegida
app.get('/clientes/busca-email', autenticarToken, async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'O parâmetro email é obrigatório' });
    }

    const cliente = await buscarClienteEmail(email);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    delete cliente.senha;
    res.json(cliente);
  } catch (error) {
    console.error('[GET /clientes/busca-email]', error);
    res.status(500).json({ error: 'Erro ao buscar cliente por email' });
  }
});

// 4. Buscar clientes por nome — protegida
app.get('/clientes/busca-nome', autenticarToken, async (req, res) => {
  try {
    const { nome } = req.query;
    if (!nome) {
      return res.status(400).json({ error: 'O parâmetro nome é obrigatório' });
    }

    const clientes = await buscarClienteNome(nome);
    res.json(clientes);
  } catch (error) {
    console.error('[GET /clientes/busca-nome]', error);
    res.status(500).json({ error: 'Erro ao buscar clientes por nome' });
  }
});

// 5. Atualizar cliente por ID — protegida
app.put('/clientes/:id', autenticarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, senha, data_nascimento } = req.body;

    const atualizado = await atualizarCliente(id, nome, email, senha, data_nascimento);

    if (!atualizado) {
      return res.status(404).json({ error: 'Cliente não encontrado para atualização' });
    }

    res.json({ message: 'Cliente atualizado com sucesso' });
  } catch (error) {
    console.error('[PUT /clientes/:id]', error);
    res.status(500).json({ error: 'Erro ao atualizar cliente' });
  }
});

// 6. Deletar cliente por ID — protegida
app.delete('/clientes/:id', autenticarToken, async (req, res) => {
  try {
    const { id } = req.params;

    const deletado = await deletarCliente(id);

    if (!deletado) {
      return res.status(404).json({ error: 'Cliente não encontrado para exclusão' });
    }

    res.json({ message: 'Cliente deletado com sucesso' });
  } catch (error) {
    console.error('[DELETE /clientes/:id]', error);
    res.status(500).json({ error: 'Erro ao deletar cliente' });
  }
});


// ==========================================
// ROTAS DE AGENDAMENTOS
// ==========================================

// 1. Listar todos os agendamentos — protegida
app.get('/agendamentos', autenticarToken, async (req, res) => {
  try {
    const agendamentos = await buscarTodosAgendamentos();
    res.json(agendamentos);
  } catch (error) {
    console.error('[GET /agendamentos]', error);
    res.status(500).json({ error: 'Erro ao listar agendamentos' });
  }
});

// 2. Criar agendamento — protegida
app.post('/agendamentos', autenticarToken, async (req, res) => {
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
    console.error('[POST /agendamentos]', error);

    if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.errno === 1452) {
      return res.status(400).json({ error: 'Erro: O cliente_id fornecido não existe.' });
    }

    res.status(500).json({ error: 'Erro ao criar agendamento' });
  }
});


// ==========================================
// INICIALIZAÇÃO DO SERVIDOR
// ==========================================
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});